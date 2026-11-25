"use client";

import { LoaderCircle, MailWarning } from "lucide-react";
import { useActionState } from "react";

import { resendVerificationEmailAction, type ResendVerificationState } from "@/actions/verify-email";

const initialState: ResendVerificationState = {
  success: false,
};

export function EmailVerificationBanner({ email }: { email: string }) {
  const [state, action, isPending] = useActionState(resendVerificationEmailAction, initialState);

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-100 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2">
        <MailWarning className="mt-0.5 size-4 shrink-0" />
        <span>{state.message ?? `Bitte bestätige deine E-Mail-Adresse ${email}. Wir haben dir dazu einen Link geschickt.`}</span>
      </p>

      {!state.success ? (
        <form action={action}>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-500/20 px-3 py-1.5 font-medium text-sky-50 transition hover:bg-sky-500/30 disabled:opacity-60"
          >
            {isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
            Erneut senden
          </button>
        </form>
      ) : null}
    </div>
  );
}
