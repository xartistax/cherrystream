"use client";

import { CircleCheck, Flag, LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";

import { submitReportAction } from "@/actions/submit-report";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { reportReasons } from "@/lib/reports/reasons";
import { cn } from "@/lib/utils";

type ReportDialogProps = {
  username: string;
  postId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Controlled, so it can be opened from places like the lightbox that unmount before the dialog shows. */
export function ReportDialog({ username, postId, open, onOpenChange }: ReportDialogProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setReason(null);
    setDetails("");
    setError(null);
    setSubmitted(false);
  }

  function handleSubmit() {
    if (!reason) {
      setError("Bitte wähle einen Grund aus.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await submitReportAction({
        username,
        postId,
        reason,
        details,
      });

      if (!result.success) {
        setError(result.message ?? "Die Meldung konnte nicht gesendet werden.");
        return;
      }

      setSubmitted(true);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) {
          return;
        }

        if (!nextOpen) {
          reset();
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="border-white/10 bg-zinc-950 text-white sm:max-w-md">
        {submitted ? (
          <div className="space-y-4 py-4 text-center">
            <CircleCheck className="mx-auto size-10 text-emerald-400" />

            <DialogTitle>Danke für deine Meldung</DialogTitle>

            <DialogDescription className="text-zinc-400">Wir prüfen sie so schnell wie möglich.</DialogDescription>

            <DialogClose render={<Button type="button" variant="outline" className="border-white/10 bg-white/5 text-white" />}>Schliessen</DialogClose>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{postId ? "Beitrag melden" : "Profil melden"}</DialogTitle>

              <DialogDescription className="text-zinc-500">
                Meldungen sind anonym. Ist eine Person in Gefahr, kontaktiere zusätzlich die Polizei (117).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              {reportReasons.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition",
                    reason === option.value ? "border-rose-500/40 bg-rose-500/10 text-white" : "border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/5",
                  )}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={option.value}
                    checked={reason === option.value}
                    onChange={() => setReason(option.value)}
                    className="accent-rose-500"
                  />
                  {option.label}
                </label>
              ))}
            </div>

            <Textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={1000}
              placeholder="Optional: Was ist dir aufgefallen?"
              className="min-h-20 border-white/10 bg-white/5"
            />

            {error ? (
              <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <DialogClose
                render={<Button type="button" variant="outline" disabled={isPending} className="border-white/10 bg-white/5 text-white hover:bg-white/10" />}
              >
                Abbrechen
              </DialogClose>

              <Button type="button" variant="destructive" disabled={isPending} onClick={handleSubmit}>
                {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Flag className="size-4" />}
                Melden
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

type ReportButtonProps = {
  username: string;
  postId?: string;
  className?: string;
  label?: string;
};

export function ReportButton({ username, postId, className, label = "Melden" }: ReportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-rose-300", className)}
      >
        <Flag className="size-3.5" />
        {label}
      </button>

      <ReportDialog username={username} postId={postId} open={open} onOpenChange={setOpen} />
    </>
  );
}
