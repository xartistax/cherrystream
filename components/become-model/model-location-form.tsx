"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import { saveModelLocationAction } from "@/actions/become-model-location";
import { LocationSelector } from "@/components/profile/location-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/types/action-state";

type CantonOption = {
  id: string;
  name: string;
  slug: string;
};

type CityOption = {
  id: string;
  name: string;
  slug: string;
  cantonId: string;
};

type ModelLocationFormProps = {
  defaultCantonId: string | null;
  defaultCityId: string | null;
  cantonOptions: CantonOption[];
  cityOptions: CityOption[];
};

const initialState: ActionState = {
  success: false,
  message: "",
};

export function ModelLocationForm({ defaultCantonId, defaultCityId, cantonOptions, cityOptions }: ModelLocationFormProps) {
  const [state, formAction, pending] = useActionState(saveModelLocationAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <Alert variant="destructive" className="border-red-500/20 bg-red-500/10 text-red-200">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <LocationSelector
        cantons={cantonOptions}
        cities={cityOptions}
        initialCantonId={defaultCantonId}
        initialCityId={defaultCityId}
        cantonError={state.errors?.cantonId}
        cityError={state.errors?.cityId}
      />

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
