import "server-only";

const SEND_TIMEOUT_MS = 8_000;

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export type TelegramResult = { ok: true } | { ok: false; error: string };

/** Sends an HTML message to the admin group. Never throws: a failed alert must not break the action that caused it. */
export async function sendTelegramMessage(html: string): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN oder TELEGRAM_CHAT_ID fehlt." };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
        link_preview_options: {
          is_disabled: true,
        },
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });

    const body = (await response.json().catch(() => null)) as { ok?: boolean; description?: string } | null;

    if (!response.ok || !body?.ok) {
      return { ok: false, error: body?.description ?? `HTTP ${response.status}` };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unbekannter Fehler" };
  }
}

export function escapeTelegramHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
