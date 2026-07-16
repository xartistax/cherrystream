"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAction } from "@/actions/register";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types/action-state";

const initialState: ActionState = {
  success: false,
};

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, initialState);

  return (
    <form action={action} className="space-y-5">
      {state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="displayName">Anzeigename</Label>
        <Input id="displayName" name="displayName" autoComplete="name" placeholder="Cherry Girl" required />
        <FieldError errors={state.errors?.displayName} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Benutzername</Label>
        <Input id="username" name="username" autoComplete="username" placeholder="cherry_girl" required />
        <FieldError errors={state.errors?.username} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="hello@cherrystream.ch" required />
        <FieldError errors={state.errors?.email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate">Geburtsdatum</Label>
        <Input id="birthDate" name="birthDate" type="date" autoComplete="bday" required />
        <FieldError errors={state.errors?.birthDate} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Passwort</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <FieldError errors={state.errors?.password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="passwordConfirmation">Passwort wiederholen</Label>
        <Input id="passwordConfirmation" name="passwordConfirmation" type="password" autoComplete="new-password" minLength={8} required />
        <FieldError errors={state.errors?.passwordConfirmation} />
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <Input id="termsAccepted" name="termsAccepted" type="checkbox" className="mt-0.5 size-4" />

          <Label htmlFor="termsAccepted" className="leading-5 text-zinc-400">
            Ich bin mindestens 18 Jahre alt und akzeptiere die Nutzungsbedingungen.
          </Label>
        </div>

        <FieldError errors={state.errors?.termsAccepted} />
      </div>

      <SubmitButton pendingText="Konto wird erstellt ...">Kostenlos registrieren</SubmitButton>

      <p className="text-center text-sm text-zinc-400">
        Bereits registriert?{" "}
        <Link href="/login" className="font-medium text-rose-400 hover:text-rose-300">
          Anmelden
        </Link>
      </p>
    </form>
  );
}
