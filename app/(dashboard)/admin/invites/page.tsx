import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Pencil } from "lucide-react";
import Link from "next/link";

import { revokeInviteAction } from "@/actions/admin/invites";
import { InviteForm, RenewInviteButton } from "@/components/admin/invite-forms";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { INVITE_VALIDITY_DAYS } from "@/lib/invites/token";
import { prisma } from "@/lib/prisma";
import { getActiveServices, groupServices } from "@/lib/services/services";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminInvitesPage() {
  const now = new Date();

  const [openInvites, claimedInvites, cantons, cities, categories, services] = await Promise.all([
    prisma.modelInvite.findMany({
      where: {
        status: "OPEN",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      select: {
        id: true,
        displayName: true,
        phoneNumber: true,
        sourceNote: true,
        categoryIds: true,
        serviceIds: true,
        cantonId: true,
        cityId: true,
        expiresAt: true,
        createdAt: true,
        createdBy: {
          select: {
            username: true,
          },
        },
      },
    }),
    prisma.modelInvite.findMany({
      where: {
        status: "CLAIMED",
      },
      orderBy: {
        claimedAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        displayName: true,
        claimedAt: true,
        claimedBy: {
          select: {
            username: true,
            modelStatus: true,
          },
        },
      },
    }),
    prisma.canton.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
    }),
    prisma.city.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, cantonId: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
    }),
    getActiveServices(),
  ]);

  const cantonNames = new Map(cantons.map((canton) => [canton.id, canton.name]));
  const cityNames = new Map(cities.map((city) => [city.id, city.name]));
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <div className="space-y-8">
      <p className="max-w-3xl text-sm leading-6 text-zinc-400">
        Vorbereitete Profile sind nie öffentlich. Das Model sieht sie über den Link, kann sie übernehmen (danach Verifizierung) oder mit einem Klick
        löschen lassen. Links sind {INVITE_VALIDITY_DAYS} Tage gültig, danach löscht der tägliche Cleanup die Daten.
      </p>

      <Card className="max-w-3xl border-white/10 bg-zinc-900/70 text-white">
        <CardContent className="space-y-4 p-6">
          <h2 className="text-lg font-bold">Neue Einladung</h2>
          <InviteForm cantons={cantons} cities={cities} categories={categories} serviceGroups={groupServices(services)} />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Offen ({openInvites.length})</h2>

        <Card className="border-white/10 bg-zinc-900/70 text-white">
          <CardContent className="divide-y divide-white/5 p-0">
            {openInvites.length === 0 ? <p className="p-6 text-sm text-zinc-500">Keine offenen Einladungen.</p> : null}

            {openInvites.map((invite) => {
              const expired = invite.expiresAt <= now;

              return (
                <div key={invite.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{invite.displayName}</p>

                    <p className="mt-0.5 text-sm text-zinc-500">
                      {invite.phoneNumber ?? "keine Nummer"} · erstellt von @{invite.createdBy?.username ?? "unbekannt"}{" "}
                      {formatDistanceToNow(invite.createdAt, { addSuffix: true, locale: de })} ·{" "}
                      <span className={expired ? "text-rose-300" : undefined}>
                        {expired ? "abgelaufen" : `gültig bis ${format(invite.expiresAt, "dd.MM.yyyy")}`}
                      </span>
                    </p>

                    <p className="mt-0.5 text-sm text-zinc-500">
                      {[invite.cityId ? cityNames.get(invite.cityId) : null, invite.cantonId ? cantonNames.get(invite.cantonId) : null]
                        .filter(Boolean)
                        .join(", ") || "kein Ort"}
                      {" · "}
                      {invite.categoryIds
                        .map((id) => categoryNames.get(id))
                        .filter(Boolean)
                        .join(", ") || "keine Rubrik"}
                      {" · "}
                      {invite.serviceIds.length} Angebote
                    </p>

                    {invite.sourceNote ? <p className="mt-0.5 text-xs text-zinc-600">{invite.sourceNote}</p> : null}
                  </div>

                  <div className="flex shrink-0 items-start gap-2">
                    <Link
                      href={`/admin/invites/${invite.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-white/10 bg-white/5 text-white")}
                    >
                      <Pencil className="size-3.5" />
                      Bearbeiten
                    </Link>

                    <RenewInviteButton inviteId={invite.id} />

                    <form action={revokeInviteAction}>
                      <input type="hidden" name="inviteId" value={invite.id} />

                      <Button type="submit" variant="outline" size="sm" className="border-white/10 bg-white/5 text-rose-300 hover:text-rose-200">
                        Widerrufen
                      </Button>
                    </form>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Zuletzt übernommen</h2>

        {claimedInvites.length === 0 ? (
          <p className="text-sm text-zinc-500">Noch keine Einladung übernommen.</p>
        ) : (
          <Card className="border-white/10 bg-zinc-900/70 text-white">
            <CardContent className="divide-y divide-white/5 p-0">
              {claimedInvites.map((invite) => (
                <p key={invite.id} className="px-5 py-3 text-sm">
                  {invite.displayName} → @{invite.claimedBy?.username ?? "gelöscht"}
                  <span className="text-zinc-500">
                    {" "}
                    · {invite.claimedBy?.modelStatus === "ACTIVE" ? "freigegeben" : "in Prüfung"}
                    {invite.claimedAt ? ` · ${formatDistanceToNow(invite.claimedAt, { addSuffix: true, locale: de })}` : null}
                  </span>
                </p>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
