import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { InviteForm } from "@/components/admin/invite-forms";
import { Card, CardContent } from "@/components/ui/card";
import { inviteBioToHtml } from "@/lib/invites/draft";
import { prisma } from "@/lib/prisma";
import { getActiveServices, groupServices } from "@/lib/services/services";

export const dynamic = "force-dynamic";

type EditInvitePageProps = {
  params: Promise<{
    inviteId: string;
  }>;
};

export default async function EditInvitePage({ params }: EditInvitePageProps) {
  const { inviteId } = await params;

  const [invite, cantons, cities, categories, services] = await Promise.all([
    prisma.modelInvite.findFirst({
      where: {
        id: inviteId,
        status: "OPEN",
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

  if (!invite) {
    notFound();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/invites" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="size-4" />
        Zurück zu den Einladungen
      </Link>

      <Card className="border-white/10 bg-zinc-900/70 text-white">
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-bold">Einladung bearbeiten</h2>

            <p className="mt-1 text-sm text-zinc-500">Änderungen sieht das Model sofort über den bestehenden Link.</p>
          </div>

          <InviteForm
            cantons={cantons}
            cities={cities}
            categories={categories}
            serviceGroups={groupServices(services)}
            invite={{
              id: invite.id,
              displayName: invite.displayName,
              gender: invite.gender,
              // Older drafts stored plain text; the editor expects HTML.
              bio: inviteBioToHtml(invite.bio) ?? "",
              phoneNumber: invite.phoneNumber ?? "",
              whatsappEnabled: invite.whatsappEnabled,
              signalNumber: invite.signalNumber ?? "",
              telegramUsername: invite.telegramUsername ?? "",
              instagram: invite.instagram ?? "",
              website: invite.website ?? "",
              contactNote: invite.contactNote ?? "",
              sourceNote: invite.sourceNote ?? "",
              cantonId: invite.cantonId,
              cityId: invite.cityId,
              categoryIds: invite.categoryIds,
              serviceIds: invite.serviceIds,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
