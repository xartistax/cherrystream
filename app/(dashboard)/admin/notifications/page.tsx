import { MessageCircle } from "lucide-react";

import { AlertSettings } from "@/components/admin/alert-settings";
import type { AdminAlertEvent } from "@/generated/prisma/enums";
import { adminAlertEvents, getAlertSettings } from "@/lib/admin-alerts/alerts";
import { isTelegramConfigured } from "@/lib/telegram/client";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const settings = await getAlertSettings();
  const configured = isTelegramConfigured();

  const events = (Object.keys(adminAlertEvents) as AdminAlertEvent[]).map((event) => ({
    event,
    ...adminAlertEvents[event],
    enabled: settings[event],
  }));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <MessageCircle className="size-5 text-rose-400" />
          Telegram-Benachrichtigungen
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Der Bot schreibt in eure gemeinsame Gruppe: was passiert ist, den Benutzernamen und einen Link hierher. Ausweise, E-Mail-Adressen und Meldetexte
          bleiben in CherryStream. Die Schalter gelten für alle Admins.
        </p>
      </div>

      {!configured ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm leading-6 text-amber-100/80">
          Telegram ist noch nicht verbunden. Setze in Vercel <code className="text-amber-100">TELEGRAM_BOT_TOKEN</code> und{" "}
          <code className="text-amber-100">TELEGRAM_CHAT_ID</code> (Anleitung in docs/telegram.md) und deploye neu.
        </div>
      ) : null}

      <AlertSettings configured={configured} events={events} />
    </div>
  );
}
