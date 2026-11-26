"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createInviteAction, type InviteActionState, renewInviteLinkAction, updateInviteAction } from "@/actions/admin/invites";
import { InviteLinks } from "@/components/admin/invite-links";
import { ProfileDescriptionEditor } from "@/components/editor/rich-text-editor";
import { CategorySelector } from "@/components/profile/category-selector";
import { LocationSelector } from "@/components/profile/location-selector";
import { ServiceSelector } from "@/components/profile/service-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: InviteActionState = {
  success: false,
};

const inputClassName = "border-white/10 bg-white/5 text-white";

function SubmitButton({ children, pendingText }: { children: React.ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="bg-rose-600 text-white hover:bg-rose-500">
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {pending ? pendingText : children}
    </Button>
  );
}

function ResultMessage({ state }: { state: InviteActionState }) {
  return (
    <>
      {state.message ? (
        <Alert variant={state.success ? "default" : "destructive"} className={state.success ? "border-white/10 bg-white/5 text-zinc-200" : undefined}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      {state.invites ? <InviteLinks invites={state.invites} /> : null}
    </>
  );
}

type InviteFormProps = {
  cantons: Array<{ id: string; name: string; slug: string }>;
  cities: Array<{ id: string; name: string; slug: string; cantonId: string }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  serviceGroups: Array<{ group: string; label: string; services: Array<{ id: string; name: string }> }>;
  /** Existing open invite to edit; without it the form creates a new invite. */
  invite?: {
    id: string;
    displayName: string;
    bio: string;
    phoneNumber: string;
    whatsappEnabled: boolean;
    signalNumber: string;
    telegramUsername: string;
    instagram: string;
    website: string;
    contactNote: string;
    sourceNote: string;
    cantonId: string | null;
    cityId: string | null;
    categoryIds: string[];
    serviceIds: string[];
  };
};

export function InviteForm({ cantons, cities, categories, serviceGroups, invite }: InviteFormProps) {
  const [state, formAction] = useActionState(invite ? updateInviteAction : createInviteAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {invite ? <input type="hidden" name="inviteId" value={invite.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="displayName">Name *</Label>
          <Input id="displayName" name="displayName" required minLength={2} maxLength={60} defaultValue={invite?.displayName} className={inputClassName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Telefon</Label>
          <Input id="phoneNumber" name="phoneNumber" placeholder="079 123 45 67" defaultValue={invite?.phoneNumber} className={inputClassName} />

          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" name="whatsappEnabled" defaultChecked={invite?.whatsappEnabled ?? true} className="size-3.5 accent-emerald-500" />
            Nummer ist auf WhatsApp erreichbar
          </label>
        </div>
      </div>

      <LocationSelector cantons={cantons} cities={cities} initialCantonId={invite?.cantonId ?? null} initialCityId={invite?.cityId ?? null} />

      <CategorySelector categories={categories} initialCategoryIds={invite?.categoryIds ?? []} />

      <div className="space-y-3">
        <div>
          <p className="font-medium text-white">Angebote</p>

          <p className="mt-1 text-sm text-zinc-500">Das Model kann die Auswahl nach der Übernahme jederzeit ändern.</p>
        </div>

        <ServiceSelector groups={serviceGroups} initialServiceIds={invite?.serviceIds ?? []} />
      </div>

      <div className="space-y-2">
        <Label>Beschreibung</Label>
        <ProfileDescriptionEditor initialValue={invite?.bio ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="telegramUsername">Telegram</Label>
          <Input id="telegramUsername" name="telegramUsername" placeholder="@name" defaultValue={invite?.telegramUsername} className={inputClassName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signalNumber">Signal</Label>
          <Input id="signalNumber" name="signalNumber" placeholder="079 123 45 67" defaultValue={invite?.signalNumber} className={inputClassName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram</Label>
          <Input id="instagram" name="instagram" placeholder="@name" defaultValue={invite?.instagram} className={inputClassName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" type="url" placeholder="https://" defaultValue={invite?.website} className={inputClassName} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactNote">Hinweis zum Kontakt (öffentlich nach der Übernahme)</Label>
        <Input
          id="contactNote"
          name="contactNote"
          maxLength={300}
          placeholder="z. B. Nur WhatsApp, keine Anrufe"
          defaultValue={invite?.contactNote}
          className={inputClassName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sourceNote">Interne Notiz (sieht das Model nicht)</Label>
        <Input
          id="sourceNote"
          name="sourceNote"
          maxLength={300}
          placeholder="z. B. Quelle des Kontakts"
          defaultValue={invite?.sourceNote}
          className={inputClassName}
        />
      </div>

      <ResultMessage state={state} />

      <SubmitButton pendingText={invite ? "Wird gespeichert ..." : "Wird erstellt ..."}>{invite ? "Änderungen speichern" : "Einladung erstellen"}</SubmitButton>
    </form>
  );
}

export function RenewInviteButton({ inviteId }: { inviteId: string }) {
  const [state, formAction, isPending] = useActionState(renewInviteLinkAction, initialState);

  return (
    <div className="space-y-2">
      <form action={formAction}>
        <input type="hidden" name="inviteId" value={inviteId} />

        <Button type="submit" variant="outline" size="sm" disabled={isPending} className="border-white/10 bg-white/5 text-white">
          {isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          Neuer Link
        </Button>
      </form>

      {state.message && !state.success ? <p className="text-xs text-rose-300">{state.message}</p> : null}
      {state.invites ? <InviteLinks invites={state.invites} /> : null}
    </div>
  );
}
