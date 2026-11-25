import "server-only";

import type { EmailMessage } from "@/lib/email/send";

type Template = Omit<EmailMessage, "to">;

export function getAppUrl(path = "/"): string {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").toString();
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

type LayoutOptions = {
  heading: string;
  paragraphs: string[];
  action?: { label: string; url: string };
  footnote?: string;
};

/** One simple, table-based layout that renders in all mail clients. Inputs are escaped here. */
function render({ heading, paragraphs, action, footnote }: LayoutOptions): Pick<EmailMessage, "html" | "text"> {
  const html = `<!doctype html>
<html lang="de">
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px;">
            <tr><td style="font-size:20px;font-weight:800;color:#e11d48;padding-bottom:24px;">CherryStream</td></tr>
            <tr><td style="font-size:22px;font-weight:700;padding-bottom:16px;">${escapeHtml(heading)}</td></tr>
            ${paragraphs
              .map((paragraph) => `<tr><td style="font-size:15px;line-height:24px;color:#3f3f46;padding-bottom:16px;">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</td></tr>`)
              .join("\n            ")}
            ${
              action
                ? `<tr><td style="padding:8px 0 24px;"><a href="${escapeHtml(action.url)}" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:10px;">${escapeHtml(action.label)}</a></td></tr>
            <tr><td style="font-size:12px;line-height:18px;color:#71717a;padding-bottom:16px;">Falls der Button nicht funktioniert: ${escapeHtml(action.url)}</td></tr>`
                : ""
            }
            ${footnote ? `<tr><td style="font-size:12px;line-height:18px;color:#a1a1aa;border-top:1px solid #e4e4e7;padding-top:16px;">${escapeHtml(footnote)}</td></tr>` : ""}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [heading, "", ...paragraphs.flatMap((paragraph) => [paragraph, ""]), ...(action ? [`${action.label}: ${action.url}`, ""] : []), ...(footnote ? [footnote] : [])]
    .join("\n")
    .trim();

  return {
    html,
    text,
  };
}

export function passwordResetEmail(resetUrl: string): Template {
  return {
    subject: "Passwort zurücksetzen",
    ...render({
      heading: "Passwort zurücksetzen",
      paragraphs: ["Du hast angefordert, dein Passwort bei CherryStream zurückzusetzen. Der Link ist 1 Stunde gültig und kann nur einmal verwendet werden."],
      action: {
        label: "Neues Passwort festlegen",
        url: resetUrl,
      },
      footnote: "Falls du das nicht warst, kannst du diese E-Mail ignorieren. Dein Passwort bleibt unverändert.",
    }),
  };
}

export function verifyEmailEmail(verifyUrl: string): Template {
  return {
    subject: "Bitte bestätige deine E-Mail-Adresse",
    ...render({
      heading: "Willkommen bei CherryStream",
      paragraphs: ["Bitte bestätige deine E-Mail-Adresse, damit wir dich bei wichtigen Ereignissen erreichen können. Der Link ist 24 Stunden gültig."],
      action: {
        label: "E-Mail bestätigen",
        url: verifyUrl,
      },
      footnote: "Falls du kein Konto erstellt hast, kannst du diese E-Mail ignorieren.",
    }),
  };
}

export function verificationApprovedEmail(displayName: string, profileUrl: string): Template {
  return {
    subject: "Dein Profil ist freigegeben",
    ...render({
      heading: `Willkommen, ${displayName}!`,
      paragraphs: [
        "Deine Verifizierung wurde geprüft und dein Profil ist jetzt öffentlich sichtbar. Deine Ausweisfotos haben wir gelöscht.",
        "Lade Fotos hoch und vervollständige deine Kontaktangaben, damit du gefunden wirst.",
      ],
      action: {
        label: "Zum Dashboard",
        url: getAppUrl("/dashboard"),
      },
      footnote: `Dein öffentliches Profil: ${profileUrl}`,
    }),
  };
}

export function verificationRejectedEmail(displayName: string, reason: string): Template {
  return {
    subject: "Deine Verifizierung braucht eine Korrektur",
    ...render({
      heading: `Hallo ${displayName}`,
      paragraphs: [
        "Wir konnten deine Verifizierung leider noch nicht freigeben. Begründung:",
        reason,
        "Du kannst neue Fotos einreichen. Du bekommst dafür einen neuen Code. Deine bisherigen Fotos haben wir gelöscht.",
      ],
      action: {
        label: "Erneut einreichen",
        url: getAppUrl("/dashboard/verification"),
      },
    }),
  };
}

export function adminNewVerificationEmail(username: string, reviewUrl: string): Template {
  return {
    subject: `Neue Verifizierung: @${username}`,
    ...render({
      heading: "Neue Verifizierung wartet",
      paragraphs: [`@${username} hat Ausweis und Selfie zur Prüfung eingereicht.`],
      action: {
        label: "Jetzt prüfen",
        url: reviewUrl,
      },
      footnote: "Interne Benachrichtigung an alle Admins.",
    }),
  };
}

export function adminUrgentReportEmail(reasonLabel: string, username: string): Template {
  return {
    subject: `Dringende Meldung: ${reasonLabel} (@${username})`,
    ...render({
      heading: "Dringende Meldung eingegangen",
      paragraphs: [`Grund: ${reasonLabel}`, `Gemeldetes Profil: @${username}`, "Bitte so schnell wie möglich prüfen."],
      action: {
        label: "Zu den Meldungen",
        url: getAppUrl("/admin/reports"),
      },
      footnote: "Interne Benachrichtigung an alle Admins.",
    }),
  };
}
