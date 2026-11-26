"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createInviteAction, importInvitesAction, type InviteActionState, renewInviteLinkAction } from "@/actions/admin/invites";
import { InviteLinks } from "@/components/admin/invite-links";
import { CategorySelector } from "@/components/profile/category-selector";
import { LocationSelector } from "@/components/profile/location-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

      {state.failures && state.failures.length > 0 ? (
        <ul className="space-y-1 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100/80">
          {state.failures.map((failure) => (
            <li key={failure.row}>
              Eintrag {failure.row} ({failure.displayName || "ohne Name"}): {failure.message}
            </li>
          ))}
        </ul>
      ) : null}

      {state.invites ? <InviteLinks invites={state.invites} /> : null}
    </>
  );
}

type CreateInviteFormProps = {
  cantons: Array<{ id: string; name: string; slug: string }>;
  cities: Array<{ id: string; name: string; slug: string; cantonId: string }>;
  categories: Array<{ id: string; name: string; slug: string }>;
};

export function CreateInviteForm({ cantons, cities, categories }: CreateInviteFormProps) {
  const [state, formAction] = useActionState(createInviteAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="displayName">Name *</Label>
          <Input id="displayName" name="displayName" required minLength={2} maxLength={60} className={inputClassName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Telefon</Label>
          <Input id="phoneNumber" name="phoneNumber" placeholder="079 123 45 67" className={inputClassName} />

          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" name="whatsappEnabled" defaultChecked className="size-3.5 accent-emerald-500" />
            Nummer ist auf WhatsApp erreichbar
          </label>
        </div>
      </div>

      <LocationSelector cantons={cantons} cities={cities} initialCantonId={null} initialCityId={null} />

      <div className="space-y-2">
        <Label>Rubriken</Label>
        <CategorySelector categories={categories} initialCategoryIds={[]} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Beschreibung</Label>
        <Textarea id="bio" name="bio" maxLength={2000} className={`min-h-24 ${inputClassName}`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="telegramUsername">Telegram</Label>
          <Input id="telegramUsername" name="telegramUsername" placeholder="@name" className={inputClassName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram</Label>
          <Input id="instagram" name="instagram" placeholder="@name" className={inputClassName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" type="url" placeholder="https://" className={inputClassName} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sourceNote">Interne Notiz (sieht das Model nicht)</Label>
        <Input id="sourceNote" name="sourceNote" maxLength={300} placeholder="z. B. Quelle des Kontakts" className={inputClassName} />
      </div>

      <ResultMessage state={state} />

      <SubmitButton pendingText="Wird erstellt ...">Einladung erstellen</SubmitButton>
    </form>
  );
}

const IMPORT_EXAMPLE = `[
  {
    "displayName": "Mia",
    "phone": "079 123 45 67",
    "whatsapp": true,
    "canton": "zh",
    "city": "zuerich",
    "categories": ["escort"],
    "bio": "Kurze Beschreibung",
    "source": "Scraper Lauf 1"
  }
]`;

export function ImportInvitesForm() {
  const [state, formAction] = useActionState(importInvitesAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="json">JSON aus dem Scraper (max. 200 Einträge)</Label>
        <Textarea id="json" name="json" required placeholder={IMPORT_EXAMPLE} className={`min-h-56 font-mono text-xs ${inputClassName}`} />
        <p className="text-xs text-zinc-500">
          Kanton als Kürzel (z. B. zh), Stadt und Rubriken als Slugs (z. B. zuerich, escort). Unbekannte Slugs werden ignoriert. Abgelehnte Kontakte und bestehende Profile werden übersprungen.
        </p>
      </div>

      <ResultMessage state={state} />

      <SubmitButton pendingText="Wird importiert ...">Importieren</SubmitButton>
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
