"use client";

import { Check, Copy, MessageCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { CreatedInvite } from "@/lib/invites/create-invite";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="border-white/10 bg-white/5 text-white"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Kopiert" : label}
    </Button>
  );
}

/** Links are only shown once: the database keeps nothing but the token hash. */
export function InviteLinks({ invites }: { invites: CreatedInvite[] }) {
  if (invites.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-emerald-200">Links werden nur jetzt angezeigt. Bitte sofort versenden oder kopieren.</p>

        {invites.length > 1 ? (
          <CopyButton text={invites.map((invite) => `${invite.displayName}\t${invite.link}`).join("\n")} label="Alle kopieren" />
        ) : null}
      </div>

      <ul className="divide-y divide-white/5">
        {invites.map((invite) => (
          <li key={invite.inviteId} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{invite.displayName}</p>

              <p className="truncate font-mono text-xs text-zinc-500">{invite.link}</p>
            </div>

            <div className="flex shrink-0 gap-2">
              <CopyButton text={invite.link} label="Link kopieren" />

              {invite.whatsappUrl ? (
                <a
                  href={invite.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[0.8rem] font-medium text-white hover:bg-emerald-500"
                >
                  <MessageCircle className="size-3.5" />
                  WhatsApp
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
