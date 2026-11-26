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
  /** Plain text; escaped before sending. */
  lines: string[];
  /** Admin page the message links to, e.g. "/admin/verifications/abc". */
  path: string;
};

/**
 * Posts a short alert to the admin Telegram group after the response is sent, so the user never waits for
 * Telegram. Only the event, a username and a link go out; documents, e-mails and report texts stay in the app.
 */
export function notifyAdmins(event: AdminAlertEvent, alert: AdminAlert): void {
  if (!isTelegramConfigured()) {
    return;
  }

  after(async () => {
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

      const result = await sendTelegramMessage(formatAlert(adminAlertEvents[event].label, alert));

      if (!result.ok) {
        console.error(`Telegram alert ${event} failed:`, result.error);
      }
    } catch (error) {
      console.error(`Telegram alert ${event} failed:`, error);
    }
  });
}

export function formatAlert(title: string, alert: AdminAlert): string {
  return [
    `<b>${escapeTelegramHtml(title)}</b>`,
    ...alert.lines.map(escapeTelegramHtml),
    `<a href="${escapeTelegramHtml(getAppUrl(alert.path))}">Im Admin-Bereich öffnen</a>`,
  ].join("\n");
}
