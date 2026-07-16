"use client";

import { Globe2, LoaderCircle, Save, UserRound } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/types/action-state";
import { updateProfileAction } from "@/actions/update-profile";
import { AvatarUpload } from "./avatar-upload";
import { CoverUpload } from "./cover-upload";
import { CategorySelector } from "./category-selector";
import { LocationSelector } from "./location-selector";

type Gender = "WOMAN" | "MAN" | "NON_BINARY" | "OTHER";

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

type ProfileFormProps = {
  user: {
    id: string;
    username: string;
    email: string;
    image: string | null;
    displayName: string;
    bio: string;
    birthDate: string;
    gender: Gender | null;
    isPublic: boolean;
    coverUrl: string | null;
    website: string;
    instagram: string;
    categoryIds: string[];
    cantonId: string | null;
    cityId: string | null;
  };

  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;

  cantonOptions: CantonOption[];
  cityOptions: CityOption[];
};

const initialState: ActionState = {
  success: false,
};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-sm text-rose-400">{errors[0]}</p>;
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="bg-rose-600 text-white hover:bg-rose-500">
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}

      {pending ? "Wird gespeichert ..." : "Änderungen speichern"}
    </Button>
  );
}

export function ProfileForm({ user, categories, cantonOptions, cityOptions }: ProfileFormProps) {
  const [state, formAction] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={user.id} />

      <section className="space-y-6 border-b border-white/10 px-5 py-8 sm:px-8">
        <CoverUpload
          user={{
            id: user.id,

            coverUrl: user.coverUrl,
          }}
        />

        <AvatarUpload
          user={{
            id: user.id,

            displayName: user.displayName,

            image: user.image,
          }}
        />
      </section>

      <div className="space-y-8 px-5 py-8 sm:px-8">
        {state.message ? (
          <Alert
            variant={state.success ? "default" : "destructive"}
            className={state.success ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : undefined}
          >
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Persönliche Angaben</h2>

            <p className="mt-1 text-sm text-zinc-500">Diese Informationen werden auf deinem öffentlichen Profil angezeigt.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">Anzeigename</Label>

              <Input id="displayName" name="displayName" defaultValue={user.displayName} minLength={2} maxLength={50} autoComplete="name" required />

              <FieldError errors={state.errors?.displayName} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Benutzername</Label>

              <Input id="username" value={user.username} disabled className="cursor-not-allowed opacity-60" />

              <p className="text-xs text-zinc-600">Der Benutzername kann derzeit nicht geändert werden.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Geburtsdatum</Label>

              <Input id="birthDate" name="birthDate" type="date" defaultValue={user.birthDate} autoComplete="bday" />

              <FieldError errors={state.errors?.birthDate} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Geschlecht</Label>

              <select
                id="gender"
                name="gender"
                defaultValue={user.gender ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-white shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="" className="bg-zinc-900">
                  Keine Angabe
                </option>

                <option value="WOMAN" className="bg-zinc-900">
                  Frau
                </option>

                <option value="MAN" className="bg-zinc-900">
                  Mann
                </option>

                <option value="NON_BINARY" className="bg-zinc-900">
                  Nicht-binär
                </option>

                <option value="OTHER" className="bg-zinc-900">
                  Andere
                </option>
              </select>

              <FieldError errors={state.errors?.gender} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="bio">Bio</Label>

              <span className="text-xs text-zinc-600">Maximal 500 Zeichen</span>
            </div>

            <Textarea id="bio" name="bio" defaultValue={user.bio} maxLength={500} placeholder="Erzähle etwas über dich ..." className="min-h-32 resize-y" />

            <FieldError errors={state.errors?.bio} />
          </div>
        </section>

        <div className="h-px bg-white/10" />

        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Profil-Kategorien</h2>

            <p className="mt-1 text-sm text-zinc-500">Kategorien werden prominent auf deinem Profil angezeigt und für die Creator-Suche verwendet.</p>
          </div>

          <CategorySelector categories={categories} initialCategoryIds={user.categoryIds} />

          <FieldError errors={state.errors?.categoryIds} />
        </section>

        <div className="h-px bg-white/10" />

        <LocationSelector
          cantons={cantonOptions}
          cities={cityOptions}
          initialCantonId={user.cantonId}
          initialCityId={user.cityId}
          cantonError={state.errors?.cantonId}
          cityError={state.errors?.cityId}
        />

        <div className="h-px bg-white/10" />

        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Links</h2>

            <p className="mt-1 text-sm text-zinc-500">Verknüpfe deine Website und deine Social-Media-Profile.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>

              <div className="relative">
                <Globe2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />

                <Input id="website" name="website" type="url" defaultValue={user.website} placeholder="https://example.com" className="pl-9" />
              </div>

              <FieldError errors={state.errors?.website} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-600">@</span>

                <Input id="instagram" name="instagram" defaultValue={user.instagram} maxLength={30} placeholder="username" className="pl-8" />
              </div>

              <FieldError errors={state.errors?.instagram} />
            </div>
          </div>
        </section>

        <div className="h-px bg-white/10" />

        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Sichtbarkeit</h2>

            <p className="mt-1 text-sm text-zinc-500">Lege fest, ob dein Profil öffentlich gefunden werden darf.</p>
          </div>

          <label
            htmlFor="isPublic"
            className="flex cursor-pointer items-start gap-4 rounded-2xl border border-white/10 bg-white/3 p-4 transition hover:bg-white/5"
          >
            <input id="isPublic" name="isPublic" type="checkbox" defaultChecked={user.isPublic} className="mt-1 size-4 accent-rose-600" />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-rose-400" />

                <span className="font-medium text-white">Öffentliches Profil</span>
              </div>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Dein Profil erscheint auf der Startseite, in der Profilsuche und kann ohne Anmeldung angesehen werden.
              </p>
            </div>
          </label>

          <FieldError errors={state.errors?.isPublic} />
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-end">
          <Button type="reset" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
            Zurücksetzen
          </Button>

          <SaveButton />
        </div>
      </div>
    </form>
  );
}
