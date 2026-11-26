"use client";

import { LoaderCircle, Save, UserRound } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { ActionState } from "@/types/action-state";
import { updateProfileAction } from "@/actions/update-profile";
import { CoverUpload } from "./cover-upload";
import { CategorySelector } from "./category-selector";
import { ServiceSelector } from "./service-selector";
import { LocationSelector } from "./location-selector";
import { ContactSettings } from "./contact-settings";
import { ProfileDescriptionEditor } from "../editor/rich-text-editor";
import { type Gender, genderOptions } from "@/lib/profile/gender";


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

    categoryIds: string[];
    serviceIds: string[];

    cantonId: string | null;
    cityId: string | null;

    phoneNumber: string;
    phoneEnabled: boolean;
    whatsappEnabled: boolean;

    telegramUsername: string;
    telegramEnabled: boolean;

    signalNumber: string;
    signalEnabled: boolean;

    website: string;
    websiteEnabled: boolean;

    instagram: string;
    instagramEnabled: boolean;

    emailPublic: string;
    emailEnabled: boolean;

    preferredContact: "PHONE" | "WHATSAPP" | "TELEGRAM" | "SIGNAL" | "WEBSITE" | "INSTAGRAM" | "EMAIL" | null;

    contactNote: string;
  };

  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;

  serviceGroups: Array<{
    group: string;
    label: string;
    services: Array<{
      id: string;
      name: string;
    }>;
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

export function ProfileForm({ user, categories, serviceGroups, cantonOptions, cityOptions }: ProfileFormProps) {
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

        <div className="flex items-center gap-4">
          <Avatar className="size-20 border-4 border-zinc-900 bg-zinc-900 shadow-xl">
            <AvatarImage src={user.image ?? undefined} alt={user.displayName} />
            <AvatarFallback className="bg-rose-500/15 text-lg text-rose-300">{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="text-sm leading-6 text-zinc-400">
            <p className="font-medium text-white">Profilbild</p>
            <p>
              Dein Profilbild ist ein Bild aus deiner Galerie, automatisch das erste.{" "}
              <Link href="/dashboard/gallery" className="font-medium text-rose-400 hover:text-rose-300">
                In der Galerie ändern
              </Link>
            </p>
          </div>
        </div>
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

            <p className="mt-1 text-sm text-zinc-500">Diese Angaben sehen Besucher auf deinem Inserat.</p>
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

                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-zinc-900">
                    {option.label}
                  </option>
                ))}
              </select>

              <FieldError errors={state.errors?.gender} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="bio">Bio</Label>

              <span className="text-xs text-zinc-600">Maximal 500 Zeichen</span>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Beschreibung</Label>

                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Stell dich vor: wer du bist, wo du empfängst, was Kunden erwartet und was du nicht machst.
                </p>
              </div>

              <ProfileDescriptionEditor initialValue={user.bio} error={state.errors?.bio} />
            </div>

            <FieldError errors={state.errors?.bio} />
          </div>
        </section>

        <div className="h-px bg-white/10" />

        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Rubriken</h2>

            <p className="mt-1 text-sm text-zinc-500">In diesen Rubriken erscheint dein Inserat, sie stehen gut sichtbar oben auf deinem Profil.</p>
          </div>

          <CategorySelector categories={categories} initialCategoryIds={user.categoryIds} />

          <FieldError errors={state.errors?.categoryIds} />
        </section>

        <div className="h-px bg-white/10" />

        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Angebote</h2>

            <p className="mt-1 text-sm text-zinc-500">Was du anbietest. Besucher können in der Suche danach filtern, dein Inserat zeigt die Auswahl an.</p>
          </div>

          <ServiceSelector groups={serviceGroups} initialServiceIds={user.serviceIds} />

          <FieldError errors={state.errors?.serviceIds} />
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

        <ContactSettings
          initialValues={{
            phoneNumber: user.phoneNumber,
            phoneEnabled: user.phoneEnabled,
            whatsappEnabled: user.whatsappEnabled,

            telegramUsername: user.telegramUsername,
            telegramEnabled: user.telegramEnabled,

            signalNumber: user.signalNumber,
            signalEnabled: user.signalEnabled,

            website: user.website,
            websiteEnabled: user.websiteEnabled,

            instagram: user.instagram,
            instagramEnabled: user.instagramEnabled,

            emailPublic: user.emailPublic,
            emailEnabled: user.emailEnabled,

            preferredContact: user.preferredContact,

            contactNote: user.contactNote,
          }}
          errors={state.errors}
        />

        <div className="h-px bg-white/10" />

        <section className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Sichtbarkeit</h2>

            <p className="mt-1 text-sm text-zinc-500">Lege fest, ob dein Inserat online ist.</p>
          </div>

          <label
            htmlFor="isPublic"
            className="flex cursor-pointer items-start gap-4 rounded-2xl border border-white/10 bg-white/3 p-4 transition hover:bg-white/5"
          >
            <input id="isPublic" name="isPublic" type="checkbox" defaultChecked={user.isPublic} className="mt-1 size-4 accent-rose-600" />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-rose-400" />

                <span className="font-medium text-white">Inserat online</span>
              </div>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Dein Inserat erscheint auf der Startseite und in der Suche und ist ohne Anmeldung sichtbar. Ausschalten, um es zu pausieren.
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
