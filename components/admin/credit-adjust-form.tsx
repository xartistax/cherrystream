"use client";

import { Coins, LoaderCircle } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { adjustCreditsAction, type AdjustCreditsState } from "@/actions/admin/credits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const initialState: AdjustCreditsState = {
  success: false,
};

type CreditAdjustFormProps = {
  userId: string;
  balance: number;
};

/** Collapsed by default so the user list stays scannable; opens a one-line form for a manual booking. */
export function CreditAdjustForm({ userId, balance }: CreditAdjustFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(adjustCreditsAction, initialState);

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="border-white/10 bg-white/5 text-amber-300">
        <Coins className="size-3.5" />
        {balance} Credits
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-2 sm:w-auto">
      <input type="hidden" name="userId" value={userId} />

      <div className="flex gap-2">
        <Input name="amount" type="number" step={1} required placeholder="+100 / -25" aria-label="Credits" className="h-8 w-28 border-white/10 bg-zinc-950" />

        <Input name="reason" required minLength={5} maxLength={200} placeholder="Grund" aria-label="Grund" className="h-8 w-48 border-white/10 bg-zinc-950" />

        <SubmitButton />

        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-zinc-400">
          Schliessen
        </Button>
      </div>

      <p className={cn("text-xs", state.message ? (state.success ? "text-emerald-300" : "text-rose-300") : "text-zinc-500")}>
        {state.message ?? `Aktuelles Guthaben: ${balance} Credits`}
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" disabled={pending} className="bg-rose-600 text-white hover:bg-rose-500">
      {pending ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
      Buchen
    </Button>
  );
}
