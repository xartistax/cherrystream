"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { claimInviteAction, type ClaimInviteState } from "@/actions/claim-invite";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const initialState: ClaimInviteState = {
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full bg-rose-600 text-white hover:bg-rose-500">
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
      Profil übernehmen
    </Button>
  );
}

export function ClaimForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(claimInviteAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <label className="flex items-start gap-3 text-sm leading-6 text-zinc-400">
        <input type="checkbox" name="consent" required className="mt-1 size-4 accent-rose-500" />

        <span>
          Ich möchte dieses Profil übernehmen. Mir ist klar, dass es erst nach meiner Altersverifizierung öffentlich wird und ich alle Angaben
          danach selbst bearbeiten kann.
        </span>
      </label>

      {state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <SubmitButton />
    </form>
  );
}
