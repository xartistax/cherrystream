import "server-only";

import { logAdminAction } from "@/lib/admin/audit";
import { createWhatsAppUrl } from "@/lib/contact/whatsapp";
import type { InviteDraft, ResolvedLocation } from "@/lib/invites/draft";
import { createInviteToken, getInviteExpiry, getInviteUrl, hashContact } from "@/lib/invites/token";
import { prisma } from "@/lib/prisma";

export type CreatedInvite = {
  inviteId: string;
  displayName: string;
  link: string;
  whatsappUrl: string | null;
};

export type CreateInviteResult = { success: true; invite: CreatedInvite } | { success: false; message: string };

export function getInviteMessage(displayName: string, link: string): string {
  return [
    `Hallo ${displayName}`,
    "",
    "wir haben dir auf CherryStream kostenlos ein Profil vorbereitet. Es ist nicht öffentlich und wird erst sichtbar, wenn du es übernimmst und dich verifizierst.",
    "",
    `Hier kannst du es ansehen, übernehmen oder mit einem Klick löschen lassen: ${link}`,
  ].join("\n");
}

export function buildCreatedInvite(inviteId: string, displayName: string, phoneNumber: string | null, token: string): CreatedInvite {
  const link = getInviteUrl(token);

  return {
    inviteId,
    displayName,
    link,
    whatsappUrl: phoneNumber ? createWhatsAppUrl(phoneNumber, getInviteMessage(displayName, link)) : null,
  };
}

export async function createInvite(draft: InviteDraft, location: ResolvedLocation, actorId: string): Promise<CreateInviteResult> {
  if (draft.phoneNumber) {
    const [declined, openInvite, existingProfile] = await Promise.all([
      prisma.declinedContact.findUnique({
        where: {
          contactHash: hashContact(draft.phoneNumber),
        },
        select: {
          contactHash: true,
        },
      }),
      prisma.modelInvite.findFirst({
        where: {
          phoneNumber: draft.phoneNumber,
          status: "OPEN",
          expiresAt: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
        },
      }),
      prisma.profile.findFirst({
        where: {
          phoneNumber: draft.phoneNumber,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (declined) {
      return {
        success: false,
        message: "Diese Person hat eine Einladung abgelehnt und darf nicht erneut eingeladen werden.",
      };
    }

    if (openInvite) {
      return {
        success: false,
        message: "Für diese Telefonnummer gibt es bereits eine offene Einladung.",
      };
    }

    if (existingProfile) {
      return {
        success: false,
        message: "Diese Telefonnummer gehört bereits zu einem Profil auf CherryStream.",
      };
    }
  }

  const { token, tokenHash } = createInviteToken();

  const invite = await prisma.$transaction(async (transaction) => {
    const created = await transaction.modelInvite.create({
      data: {
        tokenHash,
        expiresAt: getInviteExpiry(),
        displayName: draft.displayName,
        bio: draft.bio,
        phoneNumber: draft.phoneNumber,
        whatsappEnabled: draft.whatsappEnabled,
        telegramUsername: draft.telegramUsername,
        instagram: draft.instagram,
        website: draft.website,
        sourceNote: draft.sourceNote,
        cantonId: location.cantonId,
        cityId: location.cityId,
        categoryIds: location.categoryIds,
        createdById: actorId,
      },
      select: {
        id: true,
      },
    });

    await logAdminAction(transaction, {
      actorId,
      action: "INVITE_CREATED",
      targetType: "ModelInvite",
      targetId: created.id,
      metadata: {
        displayName: draft.displayName,
      },
    });

    return created;
  });

  return {
    success: true,
    invite: buildCreatedInvite(invite.id, draft.displayName, draft.phoneNumber, token),
  };
}
