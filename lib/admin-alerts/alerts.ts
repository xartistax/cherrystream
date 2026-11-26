import "server-only";

import { after } from "next/server";

import type { AdminAlertEvent } from "@/generated/prisma/enums";
import { getAppUrl } from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";
import { escapeTelegramHtml, isTelegramConfigured, sendTelegramMessage } from "@/lib/telegram/client";

export const adminAlertEvents: Record<AdminAlertEvent, { label: string; description: string }> = {
  VERIFICATION_SUBMITTED: {
    label: "Neue Verifizierung",
    description: "Ein Model hat Ausweis und Selfie eingereicht und wartet auf die Freischaltung.",
  },
  REPORT_CREATED: {
    label: "Neue Meldung",
    description: "Jemand hat ein Profil oder einen Upload gemeldet.",
  },
  INVITE_CLAIMED: {
    label: "Einladung übernommen",
    description: "Ein eingeladenes Model hat sein vorbereitetes Profil übernommen.",
  },
  MODEL_REGISTERED: {
    label: "Neues Model registriert",
    description: "Jemand hat sich selbst als Model angemeldet, die Verifizierung folgt danach.",
  },
  INVITE_DECLINED: {
    label: "Einladung abgelehnt",
    description: "Ein eingeladenes Model hat «Nicht interessiert, Daten löschen» gewählt.",
  },
  ACCOUNT_DELETED: {
    label: "Model-Konto gelöscht",
    description: "Ein Model hat sein Konto selbst gelöscht.",
  },
  ORDER_PAID: {
    label: "Credits gekauft",
    description: "Eine echte Zahlung ist eingegangen. Testzahlungen werden nicht gemeldet.",
  },
  PAYMENT_PROBLEM: {
    label: "Problem mit einer Zahlung",
    description: "Eine echte Zahlung konnte nicht verbucht werden und muss geprüft werden.",
  },
  SYSTEM_PROBLEM: {
    label: "Technisches Problem",
    description: "Der tägliche Cleanup ist fehlgeschlagen, die Statusseite meldet Fehler oder ein Upload bricht ab.",
  },
  VERIFICATION_OVERDUE: {
    label: "Verifizierungen warten",
    description: "Tägliche Erinnerung, wenn Verifizierungen länger als 24 Stunden offen sind.",
  },
  DAILY_SUMMARY: {
    label: "Tageszusammenfassung",
    description: "Jeden Morgen die Zahlen der letzten 24 Stunden: Konten, Verifizierungen, Meldungen, Einladungen, Boosts, Umsatz.",
  },
};

export async function getAlertSettings(): Promise<Record<AdminAlertEvent, boolean>> {
  const rows = await prisma.adminAlertSetting.findMany({
    select: {
      event: true,
      enabled: true,
    },
  });

  const settings = Object.fromEntries((Object.keys(adminAlertEvents) as AdminAlertEvent[]).map((event) => [event, true])) as Record<AdminAlertEvent, boolean>;

  for (const row of rows) {
    settings[row.event] = row.enabled;
  }

  return settings;
}

type AdminAlert = {
  /** Replaces the event label as heading, e.g. for the daily summary with its date. */
  title?: string;
  /** Plain text; escaped before sending. */
  lines: string[];
  /** Admin page the message links to, e.g. "/admin/verifications/abc". */
  path: string;
};

/** Sends the alert right away unless Telegram is not configured or the admins switched the event off. */
export async function sendAdminAlert(event: AdminAlertEvent, alert: AdminAlert): Promise<void> {
  if (!isTelegramConfigured()) {
    return;
  }

  try {
    const setting = await prisma.adminAlertSetting.findUnique({
      where: {
        event,
      },
      select: {
        enabled: true,
      },
    });

    if (setting && !setting.enabled) {
      return;
    }

    const result = await sendTelegramMessage(formatAlert(alert.title ?? adminAlertEvents[event].label, alert));

    if (!result.ok) {
      console.error(`Telegram alert ${event} failed:`, result.error);
    }
  } catch (error) {
    console.error(`Telegram alert ${event} failed:`, error);
  }
}

/**
 * Posts a short alert to the admin Telegram group after the response is sent, so the user never waits for
 * Telegram. Only the event, a username and a link go out; documents, e-mails and report texts stay in the app.
 */
export function notifyAdmins(event: AdminAlertEvent, alert: AdminAlert): void {
  if (!isTelegramConfigured()) {
    return;
  }

  try {
    after(() => sendAdminAlert(event, alert));
  } catch {
    // Outside a request (scripts, tests) there is no response to wait for.
    void sendAdminAlert(event, alert);
  }
}

export function formatAlert(title: string, alert: AdminAlert): string {
  return [
    `<b>${escapeTelegramHtml(title)}</b>`,
    ...alert.lines.map(escapeTelegramHtml),
    `<a href="${escapeTelegramHtml(getAppUrl(alert.path))}">Im Admin-Bereich öffnen</a>`,
  ].join("\n");
}
