"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { registerAction } from "@/actions/register";
import { FieldError } from "@/components/auth/field-error";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types/action-state";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "../ui/button";

const initialState: ActionState = {
  success: false,
};

type RegisterFormProps = {
  callbackUrl?: string;
};

export function RegisterForm({ callbackUrl }: RegisterFormProps) {
  const [state, action] = useActionState(registerAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  return (
    <form action={action} className="space-y-5">
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
      <div className="space-y-2 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
          <ShieldCheck className="size-6" />
        </div>

        <h1 className="text-2xl font-bold text-white">Konto erstellen</h1>

        <p className="text-sm leading-6 text-zinc-400">Kostenlos und diskret: Merke dir Inserate, die dir gefallen. Du bist Escort? Mit dem Konto schaltest du danach dein Inserat.</p>
      </div>
      {state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="displayName">Anzeigename</Label>

          <Input id="displayName" name="displayName" autoComplete="name" placeholder="Name oder Spitzname" maxLength={50} required />

          <FieldError errors={state.errors?.displayName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Benutzername</Label>

          <Input id="username" name="username" autoComplete="username" placeholder="dein_name" minLength={3} maxLength={24} spellCheck={false} required />

          <p className="text-xs text-zinc-500">Nur Kleinbuchstaben, Zahlen und Unterstriche.</p>

          <FieldError errors={state.errors?.username} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-Mail-Adresse</Label>

        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="name@beispiel.ch" spellCheck={false} required />

        <FieldError errors={state.errors?.email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate">Geburtsdatum</Label>

        <Input id="birthDate" name="birthDate" type="date" autoComplete="bday" max={new Date().toISOString().split("T")[0]} required />

        <p className="text-xs text-zinc-500">Du musst mindestens 18 Jahre alt sein.</p>

        <FieldError errors={state.errors?.birthDate} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Passwort</Label>

          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              className="pr-11"
              required
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
              aria-pressed={showPassword}
              className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-zinc-500 hover:bg-white/5 hover:text-white"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>

          <p className="text-xs text-zinc-500">Mindestens 8 Zeichen.</p>

          <FieldError errors={state.errors?.password} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passwordConfirmation">Passwort wiederholen</Label>

          <div className="relative">
            <Input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type={showPasswordConfirmation ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              className="pr-11"
              required
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPasswordConfirmation((current) => !current)}
              aria-label={showPasswordConfirmation ? "Passwort verbergen" : "Passwort anzeigen"}
              aria-pressed={showPasswordConfirmation}
              className="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-zinc-500 hover:bg-white/5 hover:text-white"
            >
              {showPasswordConfirmation ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>

          <FieldError errors={state.errors?.passwordConfirmation} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <input id="termsAccepted" name="termsAccepted" type="checkbox" className="mt-0.5 size-4 shrink-0 accent-rose-500" required />

          <Label htmlFor="termsAccepted" className="block flex-1 text-sm font-normal leading-6 text-zinc-400">
            Ich bestätige, dass ich mindestens 18 Jahre alt bin und akzeptiere die{" "}
            <Link href="/terms" target="_blank" className="font-medium text-rose-400 hover:text-rose-300">
              Nutzungsbedingungen
            </Link>{" "}
            sowie die{" "}
            <Link href="/privacy" target="_blank" className="font-medium text-rose-400 hover:text-rose-300">
              Datenschutzerklärung
            </Link>
            .
          </Label>
        </div>

        <FieldError errors={state.errors?.termsAccepted} />
      </div>

      <SubmitButton pendingText="Konto wird erstellt ...">Kostenloses Konto erstellen</SubmitButton>

      <p className="text-center text-sm text-zinc-400">
        Bereits registriert?{" "}
        <Link href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"} className="font-medium text-rose-400 hover:text-rose-300">
          Anmelden
        </Link>
      </p>
    </form>
  );
}
