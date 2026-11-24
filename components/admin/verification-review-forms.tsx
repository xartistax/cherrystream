"use client";

import { BadgeCheck, LoaderCircle, XCircle } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { reviewVerificationAction, type ReviewVerificationState } from "@/actions/admin/review-verification";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ReviewVerificationState = {
  success: false,
};

function SubmitButton({ children, variant }: { children: React.ReactNode; variant: "approve" | "reject" }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className={variant === "approve" ? "w-full bg-emerald-600 text-white hover:bg-emerald-500" : "w-full bg-rose-600 text-white hover:bg-rose-500"}
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : variant === "approve" ? <BadgeCheck className="size-4" /> : <XCircle className="size-4" />}
      {children}
    </Button>
  );
}

export function VerificationReviewForms({ verificationId }: { verificationId: string }) {
  const [approveState, approveAction] = useActionState(reviewVerificationAction, initialState);
  const [rejectState, rejectAction] = useActionState(reviewVerificationAction, initialState);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form action={approveAction} className="space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <input type="hidden" name="verificationId" value={verificationId} />
        <input type="hidden" name="decision" value="APPROVE" />

        <h3 className="font-semibold text-white">Freigeben</h3>

        <label className="flex items-start gap-3 text-sm leading-6 text-zinc-300">
          <input type="checkbox" name="ageConfirmed" required className="mt-1 size-4 accent-emerald-500" />

          <span>Person ist laut Ausweis mindestens 18, Gesicht stimmt mit dem Ausweis überein und der Code auf dem Selfie ist korrekt.</span>
        </label>

        {approveState.message ? (
          <Alert variant="destructive">
            <AlertDescription>{approveState.message}</AlertDescription>
          </Alert>
        ) : null}

        <SubmitButton variant="approve">Profil freigeben</SubmitButton>
      </form>

      <form action={rejectAction} className="space-y-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
        <input type="hidden" name="verificationId" value={verificationId} />
        <input type="hidden" name="decision" value="REJECT" />

        <h3 className="font-semibold text-white">Ablehnen</h3>

        <div className="space-y-2">
          <Label htmlFor="rejectionReason">Begründung (sieht das Model)</Label>

          <Textarea
            id="rejectionReason"
            name="rejectionReason"
            required
            minLength={10}
            maxLength={500}
            placeholder="z. B. Der Code auf dem Selfie ist nicht lesbar. Bitte lade ein schärferes Foto hoch."
            className="min-h-24 border-white/10 bg-white/3"
          />
        </div>

        {rejectState.message ? (
          <Alert variant="destructive">
            <AlertDescription>{rejectState.message}</AlertDescription>
          </Alert>
        ) : null}

        <SubmitButton variant="reject">Ablehnen</SubmitButton>
      </form>
    </div>
  );
}
