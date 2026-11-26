"use client";

import { Check, Copy, LoaderCircle, RefreshCw } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";

import { rotatePreviewKeyAction, setComingSoonAction } from "@/actions/admin/site";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type SiteSettingsProps = {
  comingSoon: boolean;
  previewUrl: string | null;
};

export function SiteSettings({ comingSoon, previewUrl }: SiteSettingsProps) {
  const [optimisticComingSoon, setOptimisticComingSoon] = useOptimistic(comingSoon);
  const [isSwitching, startSwitching] = useTransition();
  const [isRotating, startRotating] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-zinc-900/70 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white">Coming-Soon-Modus</p>

          <p className="mt-0.5 text-sm leading-6 text-zinc-500">
            Besucher ohne Konto sehen nur «Bald verfügbar». Weiterhin erreichbar: Anmelden, Einladungslinks samt Registrierung, Impressum,
            Datenschutz und alle mit dem Vorschau-Link. Wirkt innerhalb von 15 Sekunden.
          </p>
        </div>

        <Switch
          checked={optimisticComingSoon}
          disabled={isSwitching}
          aria-label="Coming-Soon-Modus"
          onCheckedChange={(enabled) => {
            setMessage(null);

            startSwitching(async () => {
              setOptimisticComingSoon(enabled);

              const result = await setComingSoonAction(enabled);

              if (!result.success) {
                setMessage(result.message ?? "Die Einstellung konnte nicht gespeichert werden.");
              }
            });
          }}
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-zinc-900/70 px-5 py-4">
        <div>
          <p className="font-medium text-white">Vorschau-Link</p>

          <p className="mt-0.5 text-sm leading-6 text-zinc-500">
            Wer den Link öffnet, sieht die ganze Seite für 30 Tage ohne Anmeldung, z. B. Partner oder Tester. Erneuern macht alle bisherigen Links
            ungültig.
          </p>
        </div>

        {previewUrl ? (
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">{previewUrl}</code>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(previewUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="border-white/10 bg-white/5 text-white"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Kopiert" : "Kopieren"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Noch kein Link vorhanden.</p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isRotating}
          onClick={() => {
            setMessage(null);

            startRotating(async () => {
              const result = await rotatePreviewKeyAction();
              setMessage(result.message ?? null);
            });
          }}
          className="border-white/10 bg-white/5 text-white"
        >
          {isRotating ? <LoaderCircle className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          {previewUrl ? "Link erneuern" : "Link erstellen"}
        </Button>
      </div>

      {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
    </div>
  );
}
