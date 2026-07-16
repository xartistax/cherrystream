"use client";

import { Globe2, LoaderCircle, LockKeyhole, Save, UsersRound } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { updatePostAction, type UpdatePostState } from "@/actions/update-post";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PostVisibility } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

type EditPostFormProps = {
  post: {
    id: string;
    content: string | null;
    visibility: PostVisibility;
    unlockPrice: number | null;
  };
};

const initialState: UpdatePostState = {
  success: false,
};

const visibilityOptions = [
  {
    value: "PUBLIC",
    label: "Öffentlich",
    description: "Für alle Besucher sichtbar.",
    icon: Globe2,
  },
  {
    value: "FOLLOWERS",
    label: "Follower",
    description: "Nur für angemeldete Follower sichtbar.",
    icon: UsersRound,
  },
  {
    value: "PREMIUM",
    label: "Premium",
    description: "Wird gegen Credits freigeschaltet.",
    icon: LockKeyhole,
  },
] satisfies Array<{
  value: PostVisibility;
  label: string;
  description: string;
  icon: typeof Globe2;
}>;

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-sm text-rose-400">{errors[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="bg-rose-600 text-white hover:bg-rose-500">
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}

      {pending ? "Wird gespeichert ..." : "Änderungen speichern"}
    </Button>
  );
}

export function EditPostForm({ post }: EditPostFormProps) {
  const [visibility, setVisibility] = useState<PostVisibility>(post.visibility);

  const [state, formAction] = useActionState(updatePostAction, initialState);

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="postId" value={post.id} />

      <input type="hidden" name="visibility" value={visibility} />

      {state.message ? (
        <Alert
          variant={state.success ? "default" : "destructive"}
          className={state.success ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : undefined}
        >
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="content">Beschreibung</Label>

          <span className="text-xs text-zinc-600">Maximal 2.000 Zeichen</span>
        </div>

        <Textarea
          id="content"
          name="content"
          defaultValue={post.content ?? ""}
          maxLength={2000}
          placeholder="Beschreibe deine Veröffentlichung ..."
          className="min-h-36 resize-y border-white/10 bg-white/3"
        />

        <FieldError errors={state.errors?.content} />
      </section>

      <div className="h-px bg-white/10" />

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold text-white">Sichtbarkeit</h2>

          <p className="mt-1 text-sm text-zinc-500">Lege fest, wer diesen Inhalt sehen darf.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {visibilityOptions.map((option) => {
            const Icon = option.icon;
            const selected = visibility === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setVisibility(option.value);
                }}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  selected ? "border-rose-500/40 bg-rose-500/10" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]",
                )}
              >
                <div
                  className={cn("flex size-10 items-center justify-center rounded-xl", selected ? "bg-rose-500/15 text-rose-300" : "bg-white/5 text-zinc-500")}
                >
                  <Icon className="size-4" />
                </div>

                <p className={cn("mt-4 font-semibold", selected ? "text-white" : "text-zinc-300")}>{option.label}</p>

                <p className="mt-1 text-xs leading-5 text-zinc-500">{option.description}</p>
              </button>
            );
          })}
        </div>

        <FieldError errors={state.errors?.visibility} />
      </section>

      {visibility === "PREMIUM" ? (
        <>
          <div className="h-px bg-white/10" />

          <section className="space-y-3">
            <div>
              <Label htmlFor="unlockPrice">Preis in Credits</Label>

              <p className="mt-1 text-sm text-zinc-500">Der Betrag wird beim Freischalten einmalig berechnet.</p>
            </div>

            <div className="relative max-w-xs">
              <Input
                id="unlockPrice"
                name="unlockPrice"
                type="number"
                min={1}
                max={10000}
                step={1}
                defaultValue={post.unlockPrice ?? 10}
                required
                className="border-amber-500/20 bg-amber-500/[0.05] pr-20"
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-amber-300">Credits</span>
            </div>

            <FieldError errors={state.errors?.unlockPrice} />
          </section>
        </>
      ) : null}

      <div className="flex justify-end border-t border-white/10 pt-6">
        <SubmitButton />
      </div>
    </form>
  );
}
