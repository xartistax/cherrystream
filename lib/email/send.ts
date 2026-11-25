import "server-only";

import { prisma } from "@/lib/prisma";

export type EmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult = { status: "sent"; id: string } | { status: "logged" } | { status: "failed"; error: string };

const RESEND_API_URL = "https://api.resend.com/emails";

const isDevelopment = process.env.NODE_ENV !== "production";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

function logEmail(message: EmailMessage, reason: string): void {
  console.info(
    [
      "",
      `──────── E-Mail (${reason}) ────────`,
      `An:      ${[message.to].flat().join(", ")}`,
      `Betreff: ${message.subject}`,
      "",
      message.text,
      "────────────────────────────────────────────────────────────────",
    ].join("\n"),
  );
}

/**
 * In development, EMAIL_DEV_REDIRECT sends every mail to one inbox (e.g. the Resend account address, which is the
 * only allowed recipient in Resend's test mode). The original recipients are kept in the subject.
 */
function applyDevRedirect(message: EmailMessage): EmailMessage {
  const redirectTo = process.env.EMAIL_DEV_REDIRECT;

  if (!isDevelopment || !redirectTo) {
    return message;
  }

  return {
    ...message,
    to: redirectTo,
    subject: `[an ${[message.to].flat().join(", ")}] ${message.subject}`,
  };
}

/**
 * Sends via the Resend REST API. In development, mails that are not sent (no key, or rejected by Resend)
 * are printed to the server log, so every flow can be tested locally. Never throws: callers decide whether a failed mail matters.
 */
export async function sendEmail(originalMessage: EmailMessage): Promise<SendEmailResult> {
  const message = applyDevRedirect(originalMessage);

  if (!isEmailConfigured()) {
    if (isDevelopment) {
      logEmail(message, "nicht versendet, RESEND_API_KEY fehlt");

      return {
        status: "logged",
      };
    }

    console.error("E-Mail nicht versendet: RESEND_API_KEY oder EMAIL_FROM fehlt.", { subject: message.subject });

    return {
      status: "failed",
      error: "E-Mail-Versand ist nicht konfiguriert.",
    };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [message.to].flat(),
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    const body = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;

    if (!response.ok || !body?.id) {
      const error = body?.message ?? `HTTP ${response.status}`;
      console.error("E-Mail-Versand fehlgeschlagen:", { subject: message.subject, error });

      if (isDevelopment) {
        logEmail(message, "von Resend abgelehnt, Inhalt zum Testen");
      }

      return {
        status: "failed",
        error,
      };
    }

    return {
      status: "sent",
      id: body.id,
    };
  } catch (error) {
    console.error("E-Mail-Versand fehlgeschlagen:", error);

    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

/** Emails of all active admins, for internal notifications. */
export async function getAdminEmails(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      status: "ACTIVE",
    },
    select: {
      email: true,
    },
  });

  return admins.map((admin) => admin.email);
}
