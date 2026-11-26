"use client";

import { useActionState } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";

import { deleteAccount, DeleteAccountState } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: DeleteAccountState = {
  success: false,
};

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, initialState);

  return (
    <form action={action} className="space-y-6">
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 size-5 text-rose-400" />

          <div>
            <h2 className="font-semibold text-white">Konto dauerhaft deaktivieren</h2>

            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Dein Konto wird deaktiviert, ein Inserat sofort entfernt und du wirst abgemeldet.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Passwort bestätigen</Label>

        <Input name="password" type="password" autoComplete="current-password" required />
      </div>

      {state.error && <p className="text-sm text-rose-400">{state.error}</p>}

      <Button type="submit" disabled={pending} variant="destructive">
        {pending && <LoaderCircle className="size-4 animate-spin" />}
        Konto löschen
      </Button>
    </form>
  );
}
