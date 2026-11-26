"use client";

import { LoaderCircle, Send } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";

import { sendTestAlertAction, setAlertEnabledAction } from "@/actions/admin/alerts";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type AlertSettingsProps = {
  configured: boolean;
  events: Array<{
    event: string;
    label: string;
    description: string;
    enabled: boolean;
  }>;
};

export function AlertSettings({ configured, events }: AlertSettingsProps) {
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isTesting, startTesting] = useTransition();

  const [optimisticEvents, setOptimisticEvent] = useOptimistic(events, (current, update: { event: string; enabled: boolean }) =>
    current.map((item) => (item.event === update.event ? { ...item, enabled: update.enabled } : item)),
  );

  return (
    <div className="space-y-6">
      <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-zinc-900/70">
        {optimisticEvents.map((item) => (
          <div key={item.event} className="flex items-center gap-4 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white">{item.label}</p>

              <p className="mt-0.5 text-sm text-zinc-500">{item.description}</p>
            </div>

            <Switch
              checked={item.enabled}
              disabled={isPending}
              aria-label={item.label}
              onCheckedChange={(enabled) => {
                setError(null);

                startTransition(async () => {
                  setOptimisticEvent({ event: item.event, enabled });

                  const result = await setAlertEnabledAction(item.event, enabled);

                  if (!result.success) {
                    setError(result.message ?? "Die Einstellung konnte nicht gespeichert werden.");
                  }
                });
              }}
            />
          </div>
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={!configured || isTesting}
          onClick={() => {
            setTestResult(null);

            startTesting(async () => {
              setTestResult(await sendTestAlertAction());
            });
          }}
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          {isTesting ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
          Testnachricht senden
        </Button>

        {testResult?.message ? <p className={cn("text-sm", testResult.success ? "text-emerald-300" : "text-rose-300")}>{testResult.message}</p> : null}
      </div>
    </div>
  );
}
