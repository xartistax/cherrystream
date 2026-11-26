import { format } from "date-fns";
import { de } from "date-fns/locale";
import { AtSign, Globe2, Link2Off, MapPin, MessageCircle, MessageSquareLock, Phone, Send, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { declineInviteAction } from "@/actions/claim-invite";
import { ClaimForm } from "@/components/invites/claim-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { inviteBioToHtml } from "@/lib/invites/draft";
import { getOpenInvite } from "@/lib/invites/get-open-invite";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// The token is part of the URL: keep it out of search engines and out of Referer headers to linked sites.
export const metadata: Metadata = {
  title: "Dein vorbereitetes Profil",
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

type ClaimPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { token } = await params;
  const invite = await getOpenInvite(token);

  if (!invite) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <Link2Off className="mx-auto size-10 text-zinc-500" />

        <h1 className="mt-6 text-2xl font-bold">Dieser Link ist nicht mehr gültig</h1>

        <p className="mt-3 text-zinc-400">Die Einladung ist abgelaufen, wurde bereits verwendet oder gelöscht.</p>

        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-8 border-white/10 bg-white/5")}>
          Zur Startseite
        </Link>
      </div>
    );
  }

  const session = await auth();
  const callbackUrl = encodeURIComponent(`/claim/${token}`);

  const [canton, city, categories, services, viewer] = await Promise.all([
    invite.cantonId ? prisma.canton.findUnique({ where: { id: invite.cantonId }, select: { name: true } }) : null,
    invite.cityId ? prisma.city.findUnique({ where: { id: invite.cityId }, select: { name: true } }) : null,
    invite.categoryIds.length > 0
      ? prisma.category.findMany({ where: { id: { in: invite.categoryIds } }, select: { id: true, name: true }, orderBy: { sortOrder: "asc" } })
      : [],
    invite.serviceIds.length > 0
      ? prisma.service.findMany({ where: { id: { in: invite.serviceIds }, isActive: true }, select: { id: true, name: true }, orderBy: { sortOrder: "asc" } })
      : [],
    session?.user?.id ? prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, modelStatus: true } }) : null,
  ]);

  const canClaim = viewer?.role === "USER" && viewer.modelStatus === "NONE";
  const location = [city?.name, canton?.name].filter(Boolean).join(", ");
  const bioHtml = inviteBioToHtml(invite.bio);

  const contacts = [
    invite.phoneNumber ? { icon: invite.whatsappEnabled ? MessageCircle : Phone, label: `${invite.whatsappEnabled ? "WhatsApp" : "Telefon"}: ${invite.phoneNumber}` } : null,
    invite.telegramUsername ? { icon: Send, label: `Telegram: @${invite.telegramUsername}` } : null,
    invite.signalNumber ? { icon: MessageSquareLock, label: `Signal: ${invite.signalNumber}` } : null,
    invite.instagram ? { icon: AtSign, label: `Instagram: @${invite.instagram}` } : null,
    invite.website ? { icon: Globe2, label: invite.website } : null,
  ].filter((contact) => contact !== null);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-16">
      <div className="text-center">
        <p className="text-sm font-medium text-rose-400">Einladung</p>

        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Wir haben dir ein Profil vorbereitet</h1>

        <p className="mx-auto mt-4 max-w-lg leading-7 text-zinc-400">
          Das Profil ist <strong className="text-white">nicht öffentlich</strong>. Es wird erst sichtbar, wenn du es übernimmst und dein Alter
          verifizierst. Du kannst es auch mit einem Klick löschen lassen.
        </p>
      </div>

      <Card className="border-white/10 bg-zinc-900/70 text-white">
        <CardContent className="space-y-5 p-6">
          <div>
            <h2 className="text-2xl font-bold">{invite.displayName}</h2>

            {location ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
                <MapPin className="size-4" />
                {location}
              </p>
            ) : null}
          </div>

          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span key={category.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                  {category.name}
                </span>
              ))}
            </div>
          ) : null}

          {services.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-zinc-500 uppercase">Angebote</p>

              <div className="flex flex-wrap gap-2">
                {services.map((service) => (
                  <span key={service.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                    {service.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {bioHtml ? (
            <div
              className="text-sm leading-7 text-zinc-300 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_h3]:mt-3 [&_h3]:font-semibold [&_h3]:text-white [&_li::marker]:text-rose-400 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: bioHtml }}
            />
          ) : null}

          {contacts.length > 0 ? (
            <ul className="space-y-2 text-sm text-zinc-400">
              {contacts.map((contact) => (
                <li key={contact.label} className="flex items-center gap-2">
                  <contact.icon className="size-4 shrink-0" />
                  {contact.label}
                </li>
              ))}
            </ul>
          ) : null}

          {invite.contactNote ? <p className="text-sm text-zinc-400">{invite.contactNote}</p> : null}

          <p className="text-xs text-zinc-600">
            Fotos lädst du nach der Übernahme selbst hoch. Gültig bis {format(invite.expiresAt, "d. MMMM yyyy", { locale: de })}.
          </p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-zinc-900/70 text-white">
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold">Profil übernehmen</h2>

          {!viewer ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href={`/register?callbackUrl=${callbackUrl}`} className={cn(buttonVariants(), "bg-rose-600 text-white hover:bg-rose-500")}>
                Konto erstellen
              </Link>

              <Link href={`/login?callbackUrl=${callbackUrl}`} className={cn(buttonVariants({ variant: "outline" }), "border-white/10 bg-white/5")}>
                Ich habe schon ein Konto
              </Link>
            </div>
          ) : canClaim ? (
            <ClaimForm token={token} />
          ) : (
            <p className="text-sm leading-6 text-zinc-400">
              Dein Konto hat bereits ein Model-Profil. Melde dich ab und mit einem anderen Konto an, oder lehne die Einladung unten ab.
            </p>
          )}
        </CardContent>
      </Card>

      <form action={declineInviteAction} className="text-center">
        <input type="hidden" name="token" value={token} />

        <button type="submit" className="inline-flex items-center gap-2 text-sm text-zinc-500 underline-offset-4 transition hover:text-rose-300 hover:underline">
          <Trash2 className="size-4" />
          Nicht interessiert, meine Daten löschen
        </button>

        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-zinc-600">
          Das vorbereitete Profil wird sofort gelöscht und du wirst nicht erneut eingeladen.
        </p>
      </form>
    </div>
  );
}
