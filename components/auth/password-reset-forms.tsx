"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordResetAction, resetPasswordAction } from "@/actions/password-reset";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types/action-state";

const initialState: ActionState = {
  success: false,
};

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordResetAction, initialState);

  if (state.success) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-300">{state.message}</div>

        <p className="text-center text-sm text-zinc-400">
          <Link href="/login" className="font-medium text-rose-400 hover:text-rose-300">
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError errors={state.errors?.email} />
      </div>

      <SubmitButton pendingText="Wird gesendet ...">Link senden</SubmitButton>

      <p className="text-center text-sm text-zinc-400">
        <Link href="/login" className="font-medium text-rose-400 hover:text-rose-300">
          Zurück zur Anmeldung
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      {state.message ? (
        <Alert variant="destructive">
          <AlertDescription>
            {state.message}{" "}
            <Link href="/forgot-password" className="underline">
              Neuen Link anfordern
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="password">Neues Passwort</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
        <FieldError errors={state.errors?.password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="passwordConfirmation">Passwort wiederholen</Label>
        <Input id="passwordConfirmation" name="passwordConfirmation" type="password" autoComplete="new-password" required />
        <FieldError errors={state.errors?.passwordConfirmation} />
      </div>

      <SubmitButton pendingText="Wird gespeichert ...">Passwort speichern</SubmitButton>
    </form>
  );
}
