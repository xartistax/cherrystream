"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction } from "@/actions/login";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types/action-state";

const initialState: ActionState = {
  success: false,
};

type LoginFormProps = {
  callbackUrl?: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [state, action] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-5">
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
      {state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="hello@cherrystream.ch" required />
        <FieldError errors={state.errors?.email} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="password">Passwort</Label>

          <Link href="/forgot-password" className="text-xs text-zinc-400 hover:text-rose-300">
            Passwort vergessen?
          </Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
        <FieldError errors={state.errors?.password} />
      </div>

      <SubmitButton pendingText="Anmelden ...">Anmelden</SubmitButton>

      <p className="text-center text-sm text-zinc-400">
        Noch kein Konto?{" "}
        <Link href={callbackUrl ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/register"} className="font-medium text-rose-400 hover:text-rose-300">
          Jetzt registrieren
        </Link>
      </p>
    </form>
  );
}
