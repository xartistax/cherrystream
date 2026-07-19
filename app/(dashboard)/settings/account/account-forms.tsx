"use client";

import { useActionState } from "react";
import { LoaderCircle, Mail, ShieldCheck } from "lucide-react";

import { initialAccountActionState, updateEmail, updatePassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AccountFormsProps = {
  email: string;
};

function FormMessage({ status, message }: { status: "idle" | "success" | "error"; message: string }) {
  if (status === "idle" || !message) {
    return null;
  }

  return (
    <p role="status" className={status === "success" ? "text-sm text-emerald-400" : "text-sm text-rose-400"}>
      {message}
    </p>
  );
}

export function AccountForms({ email }: AccountFormsProps) {
  const [emailState, emailAction, emailPending] = useActionState(updateEmail, initialAccountActionState);

  const [passwordState, passwordAction, passwordPending] = useActionState(updatePassword, initialAccountActionState);

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
              <Mail className="size-5" />
            </div>

            <div>
              <CardTitle className="text-lg text-white">E-Mail-Adresse</CardTitle>
              <CardDescription className="mt-1 text-zinc-500">Diese Adresse wird für die Anmeldung und wichtige Hinweise verwendet.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form action={emailAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input id="email" name="email" type="email" defaultValue={email} autoComplete="email" required className="border-white/10 bg-black/20" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-current-password">Aktuelles Passwort</Label>
              <Input
                id="email-current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                className="border-white/10 bg-black/20"
              />
            </div>

            <FormMessage {...emailState} />

            <Button type="submit" disabled={emailPending} className="bg-rose-600 text-white hover:bg-rose-500">
              {emailPending && <LoaderCircle className="size-4 animate-spin" />}
              E-Mail speichern
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
              <ShieldCheck className="size-5" />
            </div>

            <div>
              <CardTitle className="text-lg text-white">Passwort ändern</CardTitle>
              <CardDescription className="mt-1 text-zinc-500">Verwende mindestens acht Zeichen und ein einzigartiges Passwort.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form action={passwordAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password-current">Aktuelles Passwort</Label>
              <Input
                id="password-current"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                className="border-white/10 bg-black/20"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">Neues Passwort</Label>
                <Input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  required
                  className="border-white/10 bg-black/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Passwort bestätigen</Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  required
                  className="border-white/10 bg-black/20"
                />
              </div>
            </div>

            <FormMessage {...passwordState} />

            <Button type="submit" disabled={passwordPending} className="bg-rose-600 text-white hover:bg-rose-500">
              {passwordPending && <LoaderCircle className="size-4 animate-spin" />}
              Passwort aktualisieren
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
