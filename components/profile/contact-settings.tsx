"use client";

import { Globe2, Mail, MessageCircle, Phone, Radio, Send } from "lucide-react";
import { FaInstagram } from "react-icons/fa6";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ContactChannel = "PHONE" | "WHATSAPP" | "TELEGRAM" | "SIGNAL" | "WEBSITE" | "INSTAGRAM" | "EMAIL";

type ContactSettingsErrors = Partial<
  Record<
    | "phoneNumber"
    | "phoneEnabled"
    | "whatsappEnabled"
    | "telegramUsername"
    | "telegramEnabled"
    | "signalNumber"
    | "signalEnabled"
    | "website"
    | "websiteEnabled"
    | "instagram"
    | "instagramEnabled"
    | "emailPublic"
    | "emailEnabled"
    | "preferredContact"
    | "contactNote",
    string[]
  >
>;

type ContactSettingsProps = {
  initialValues: {
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
    preferredContact: ContactChannel | null;
    contactNote: string;
  };
  errors?: ContactSettingsErrors;
};

type ChannelToggleProps = {
  id: string;
  name: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-sm text-rose-400">{errors[0]}</p>;
}

function ChannelToggle({ id, name, label, description, checked, onCheckedChange }: ChannelToggleProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
    >
      <span>
        <span className="block font-medium text-white">{label}</span>

        <span className="mt-1 block text-sm leading-5 text-zinc-500">{description}</span>
      </span>

      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          onCheckedChange(event.target.checked);
        }}
        className="mt-1 size-4 shrink-0 accent-rose-600"
      />
    </label>
  );
}

export function ContactSettings({ initialValues, errors }: ContactSettingsProps) {
  const [phoneEnabled, setPhoneEnabled] = useState(initialValues.phoneEnabled);
  const [whatsappEnabled, setWhatsappEnabled] = useState(initialValues.whatsappEnabled);
  const [telegramEnabled, setTelegramEnabled] = useState(initialValues.telegramEnabled);
  const [signalEnabled, setSignalEnabled] = useState(initialValues.signalEnabled);
  const [websiteEnabled, setWebsiteEnabled] = useState(initialValues.websiteEnabled);
  const [instagramEnabled, setInstagramEnabled] = useState(initialValues.instagramEnabled);
  const [emailEnabled, setEmailEnabled] = useState(initialValues.emailEnabled);
  const [preferredContact, setPreferredContact] = useState<ContactChannel | "">(initialValues.preferredContact ?? "");

  const enabledChannels: Array<{
    value: ContactChannel;
    label: string;
  }> = [
    ...(phoneEnabled ? [{ value: "PHONE" as const, label: "Telefon" }] : []),
    ...(whatsappEnabled ? [{ value: "WHATSAPP" as const, label: "WhatsApp" }] : []),
    ...(telegramEnabled ? [{ value: "TELEGRAM" as const, label: "Telegram" }] : []),
    ...(signalEnabled ? [{ value: "SIGNAL" as const, label: "Signal" }] : []),
    ...(websiteEnabled ? [{ value: "WEBSITE" as const, label: "Website" }] : []),
    ...(instagramEnabled ? [{ value: "INSTAGRAM" as const, label: "Instagram" }] : []),
    ...(emailEnabled ? [{ value: "EMAIL" as const, label: "E-Mail" }] : []),
  ];

  function updateChannel(channel: ContactChannel, enabled: boolean, setter: (value: boolean) => void) {
    setter(enabled);

    if (!enabled && preferredContact === channel) {
      setPreferredContact("");
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <MessageCircle className="size-4 text-rose-400" />

          <h2 className="text-lg font-bold text-white">Kontaktmöglichkeiten</h2>
        </div>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Entscheide selbst, wie Besucher dich kontaktieren dürfen. Es werden nur aktivierte Kontaktmöglichkeiten öffentlich angezeigt.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-5">
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-emerald-400" />

            <h3 className="font-semibold text-white">Telefonnummer</h3>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="phoneNumber">Telefonnummer</Label>

            <Input id="phoneNumber" name="phoneNumber" type="tel" defaultValue={initialValues.phoneNumber} placeholder="+41 79 123 45 67" autoComplete="tel" />

            <p className="text-xs text-zinc-600">Dieselbe Nummer kann für Anrufe und WhatsApp verwendet werden.</p>

            <FieldError errors={errors?.phoneNumber} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ChannelToggle
              id="phoneEnabled"
              name="phoneEnabled"
              label="Telefonanrufe"
              description="Besucher dürfen dich direkt anrufen."
              checked={phoneEnabled}
              onCheckedChange={(checked) => {
                updateChannel("PHONE", checked, setPhoneEnabled);
              }}
            />

            <ChannelToggle
              id="whatsappEnabled"
              name="whatsappEnabled"
              label="WhatsApp"
              description="Besucher dürfen dich über WhatsApp kontaktieren."
              checked={whatsappEnabled}
              onCheckedChange={(checked) => {
                updateChannel("WHATSAPP", checked, setWhatsappEnabled);
              }}
            />
          </div>

          <FieldError errors={errors?.phoneEnabled} />
          <FieldError errors={errors?.whatsappEnabled} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-5">
            <div className="flex items-center gap-2">
              <Send className="size-4 text-sky-400" />

              <h3 className="font-semibold text-white">Telegram</h3>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="telegramUsername">Benutzername</Label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-600">@</span>

                <Input
                  id="telegramUsername"
                  name="telegramUsername"
                  defaultValue={initialValues.telegramUsername}
                  maxLength={32}
                  placeholder="username"
                  className="pl-8"
                />
              </div>

              <FieldError errors={errors?.telegramUsername} />
            </div>

            <div className="mt-4">
              <ChannelToggle
                id="telegramEnabled"
                name="telegramEnabled"
                label="Telegram anzeigen"
                description="Telegram als Kontaktmöglichkeit freigeben."
                checked={telegramEnabled}
                onCheckedChange={(checked) => {
                  updateChannel("TELEGRAM", checked, setTelegramEnabled);
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-5">
            <div className="flex items-center gap-2">
              <Radio className="size-4 text-blue-400" />

              <h3 className="font-semibold text-white">Signal</h3>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="signalNumber">Signal-Nummer</Label>

              <Input
                id="signalNumber"
                name="signalNumber"
                type="tel"
                defaultValue={initialValues.signalNumber}
                placeholder="+41 79 123 45 67"
                autoComplete="tel"
              />

              <FieldError errors={errors?.signalNumber} />
            </div>

            <div className="mt-4">
              <ChannelToggle
                id="signalEnabled"
                name="signalEnabled"
                label="Signal anzeigen"
                description="Signal als Kontaktmöglichkeit freigeben."
                checked={signalEnabled}
                onCheckedChange={(checked) => {
                  updateChannel("SIGNAL", checked, setSignalEnabled);
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-5">
            <div className="flex items-center gap-2">
              <Globe2 className="size-4 text-violet-400" />

              <h3 className="font-semibold text-white">Website</h3>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="website">Website</Label>

              <Input id="website" name="website" type="url" defaultValue={initialValues.website} placeholder="https://example.com" />

              <FieldError errors={errors?.website} />
            </div>

            <div className="mt-4">
              <ChannelToggle
                id="websiteEnabled"
                name="websiteEnabled"
                label="Website anzeigen"
                description="Deine Website öffentlich verlinken."
                checked={websiteEnabled}
                onCheckedChange={(checked) => {
                  updateChannel("WEBSITE", checked, setWebsiteEnabled);
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-5">
            <div className="flex items-center gap-2">
              <FaInstagram className="size-4 text-pink-400" />

              <h3 className="font-semibold text-white">Instagram</h3>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="instagram">Benutzername</Label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-600">@</span>

                <Input id="instagram" name="instagram" defaultValue={initialValues.instagram} maxLength={30} placeholder="username" className="pl-8" />
              </div>

              <FieldError errors={errors?.instagram} />
            </div>

            <div className="mt-4">
              <ChannelToggle
                id="instagramEnabled"
                name="instagramEnabled"
                label="Instagram anzeigen"
                description="Dein Instagram-Profil öffentlich verlinken."
                checked={instagramEnabled}
                onCheckedChange={(checked) => {
                  updateChannel("INSTAGRAM", checked, setInstagramEnabled);
                }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-5">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-amber-400" />

            <h3 className="font-semibold text-white">Öffentliche E-Mail</h3>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
            <div className="space-y-2">
              <Label htmlFor="emailPublic">Kontakt-E-Mail</Label>

              <Input
                id="emailPublic"
                name="emailPublic"
                type="email"
                defaultValue={initialValues.emailPublic}
                placeholder="kontakt@example.com"
                autoComplete="email"
              />

              <FieldError errors={errors?.emailPublic} />
            </div>

            <ChannelToggle
              id="emailEnabled"
              name="emailEnabled"
              label="E-Mail anzeigen"
              description="Besucher dürfen dir eine E-Mail schreiben."
              checked={emailEnabled}
              onCheckedChange={(checked) => {
                updateChannel("EMAIL", checked, setEmailEnabled);
              }}
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-white/10" />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-3">
          <div>
            <Label>⭐ Primäre Kontaktmöglichkeit</Label>

            <p className="mt-1 text-sm text-zinc-500">Diese Kontaktmöglichkeit wird auf deinem öffentlichen Profil hervorgehoben.</p>
          </div>

          {enabledChannels.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-500">
              Aktiviere zuerst mindestens eine Kontaktmöglichkeit.
            </div>
          ) : (
            <div className="space-y-3">
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition",
                  preferredContact === "" ? "border-rose-500/40 bg-rose-500/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
                )}
              >
                <input
                  type="radio"
                  name="preferredContact"
                  value=""
                  checked={preferredContact === ""}
                  onChange={() => setPreferredContact("")}
                  className="mt-1 accent-rose-600"
                />

                <div>
                  <p className="font-medium text-white">Keine Hervorhebung</p>

                  <p className="mt-1 text-sm text-zinc-500">Alle Kontaktmöglichkeiten werden gleich dargestellt.</p>
                </div>
              </label>

              {enabledChannels.map((channel) => (
                <label
                  key={channel.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition",
                    preferredContact === channel.value ? "border-rose-500/40 bg-rose-500/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
                  )}
                >
                  <input
                    type="radio"
                    name="preferredContact"
                    value={channel.value}
                    checked={preferredContact === channel.value}
                    onChange={() => setPreferredContact(channel.value)}
                    className="mt-1 accent-rose-600"
                  />

                  <div>
                    <p className="font-medium text-white">{channel.label}</p>

                    <p className="mt-1 text-sm text-zinc-500">Diese Kontaktmöglichkeit wird Besuchern zuerst empfohlen.</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <FieldError errors={errors?.preferredContact} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactNote">Kontakthinweis</Label>

          <Textarea
            id="contactNote"
            name="contactNote"
            defaultValue={initialValues.contactNote}
            maxLength={300}
            placeholder="Zum Beispiel: Termine bitte nur telefonisch vereinbaren. Keine WhatsApp-Anrufe."
            className="min-h-28 resize-y"
          />

          <p className="text-xs text-zinc-600">Maximal 300 Zeichen.</p>

          <FieldError errors={errors?.contactNote} />
        </div>
      </div>
    </section>
  );
}
