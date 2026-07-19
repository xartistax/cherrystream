"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import { saveModelCategoriesAction } from "@/actions/become-model-categories";
import { CategorySelector } from "@/components/profile/category-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/types/action-state";

type Props = {
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];

  initialCategoryIds: string[];
};

const initialState: ActionState = {
  success: false,
  message: "",
};

export function ModelCategoryForm({ categories, initialCategoryIds }: Props) {
  const [state, formAction, pending] = useActionState(saveModelCategoriesAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <Alert variant="destructive" className="border-red-500/20 bg-red-500/10 text-red-200">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <CategorySelector categories={categories} initialCategoryIds={initialCategoryIds} />

      <Button type="submit" disabled={pending} className="w-full bg-rose-600 hover:bg-rose-500">
        {pending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Wird gespeichert...
          </>
        ) : (
          "Weiter"
        )}
      </Button>
    </form>
  );
}
