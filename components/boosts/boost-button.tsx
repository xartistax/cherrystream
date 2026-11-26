"use client";

import { LoaderCircle, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { purchaseBoostAction } from "@/actions/boosts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type BoostButtonProps = {
  option: {
    id: string;
    label: string;
    credits: number;
  };
  balance: number;
  /** Shown instead of the price when the boost cannot be bought right now, e.g. during the bump cooldown. */
  blockedReason?: string | null;
  /** Extra line in the confirmation, e.g. that a highlight extends the running one. */
  note?: string | null;
  label?: string;
  className?: string;
};

/** Spends credits only after a confirmation; the request ID makes a double click book once. */
export function BoostButton({ option, balance, blockedReason, note, label, className }: BoostButtonProps) {
  const router = useRouter();
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const affordable = balance >= option.credits;
  const disabled = Boolean(blockedReason) || !affordable;

  return (
    <div className="space-y-2">
      <Button
        type="button"
        disabled={disabled}
        onClick={() => {
          setError(null);
          setRequestId(crypto.randomUUID());
        }}
        className={cn("w-full bg-rose-600 text-white hover:bg-rose-500", className)}
      >
        <Rocket className="size-4" />
        {label ?? `${option.credits} Credits`}
      </Button>

      {blockedReason ? <p className="text-xs text-zinc-500">{blockedReason}</p> : !affordable ? <p className="text-xs text-zinc-500">Zu wenig Credits</p> : null}

      {error ? (
        <p role="alert" className="text-xs text-rose-300">
          {error}
        </p>
      ) : null}

      <Dialog
        open={requestId !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            setRequestId(null);
          }
        }}
      >
        <DialogContent className="border-white/10 bg-zinc-950 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{option.label} buchen?</DialogTitle>

            <DialogDescription className="text-zinc-500">
              Kostet {option.credits} Credits. Danach hast du noch {balance - option.credits} Credits.
              {note ? ` ${note}` : ""}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={isPending} className="border-white/10 bg-white/5 text-white hover:bg-white/10" />}>
              Abbrechen
            </DialogClose>

            <Button
              type="button"
              disabled={isPending}
              className="bg-rose-600 text-white hover:bg-rose-500"
              onClick={() => {
                if (!requestId) {
                  return;
                }

                startTransition(async () => {
                  const result = await purchaseBoostAction(option.id, requestId);

                  if (!result.success) {
                    setError(result.message ?? "Die Buchung hat nicht geklappt. Bitte versuch es nochmals.");
                  }

                  setRequestId(null);
                  router.refresh();
                });
              }}
            >
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Rocket className="size-4" />}
              Buchen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
