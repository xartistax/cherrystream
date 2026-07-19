"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import { saveModelProfileAction } from "@/actions/become-model";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/types/action-state";
import { profile } from "console";
import { ProfileDescriptionEditor } from "../editor/rich-text-editor";

type ModelProfileFormProps = {
  defaultDisplayName: string;
  defaultBio: string;
};

const initialState: ActionState = {
  success: false,
  message: "",
};

export function ModelProfileForm({ defaultDisplayName, defaultBio }: ModelProfileFormProps) {
  const [state, formAction, pending] = useActionState(saveModelProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <Alert variant="destructive" className="border-red-500/20 bg-red-500/10 text-red-200">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="displayName">Anzeigename</Label>

        <Input
          id="displayName"
          name="displayName"
          defaultValue={defaultDisplayName}
          minLength={2}
          maxLength={50}
          required
          autoComplete="name"
          className="border-white/10 bg-black/20 text-white"
        />

        {state.errors?.displayName?.[0] ? (
          <p className="text-sm text-red-400">{state.errors.displayName[0]}</p>
        ) : (
          <p className="text-sm text-zinc-500">Dieser Name wird auf deinem öffentlichen Profil angezeigt.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Über dich</Label>

        <ProfileDescriptionEditor initialValue={defaultBio ?? ""} error={state.errors?.bio} />

        {state.errors?.bio?.[0] ? (
          <p className="text-sm text-red-400">{state.errors.bio[0]}</p>
        ) : (
          <p className="text-sm text-zinc-500">Du kannst deine Beschreibung später jederzeit bearbeiten.</p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="w-full bg-rose-600 text-white hover:bg-rose-500">
        {pending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Wird gespeichert
          </>
        ) : (
          "Weiter"
        )}
      </Button>
    </form>
  );
}
