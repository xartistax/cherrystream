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
    "wir haben dir auf CherryStream kostenlos ein Inserat vorbereitet. Es ist nicht öffentlich und wird erst sichtbar, wenn du es übernimmst und dich verifizierst.",
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

/** A number may not be invited again after a decline, twice at once, or when it already belongs to a profile. */
async function checkPhoneNumber(phoneNumber: string, excludeInviteId?: string): Promise<string | null> {
  const [declined, openInvite, existingProfile] = await Promise.all([
    prisma.declinedContact.findUnique({
      where: {
        contactHash: hashContact(phoneNumber),
      },
      select: {
        contactHash: true,
      },
    }),
    prisma.modelInvite.findFirst({
      where: {
        phoneNumber,
        status: "OPEN",
        expiresAt: {
          gt: new Date(),
        },
        ...(excludeInviteId ? { id: { not: excludeInviteId } } : {}),
      },
      select: {
        id: true,
      },
    }),
    prisma.profile.findFirst({
      where: {
        phoneNumber,
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (declined) {
    return "Diese Person hat eine Einladung abgelehnt und darf nicht erneut eingeladen werden.";
  }

  if (openInvite) {
    return "Für diese Telefonnummer gibt es bereits eine offene Einladung.";
  }

  if (existingProfile) {
    return "Diese Telefonnummer gehört bereits zu einem Profil auf CherryStream.";
  }

  return null;
}

function draftData(draft: InviteDraft, location: ResolvedLocation) {
  return {
    displayName: draft.displayName,
    bio: draft.bio,
    phoneNumber: draft.phoneNumber,
    whatsappEnabled: draft.whatsappEnabled,
    telegramUsername: draft.telegramUsername,
    signalNumber: draft.signalNumber,
    instagram: draft.instagram,
    website: draft.website,
    contactNote: draft.contactNote,
    sourceNote: draft.sourceNote,
    cantonId: location.cantonId,
    cityId: location.cityId,
    categoryIds: location.categoryIds,
    serviceIds: location.serviceIds,
  };
}

export async function createInvite(draft: InviteDraft, location: ResolvedLocation, actorId: string): Promise<CreateInviteResult> {
  const phoneProblem = draft.phoneNumber ? await checkPhoneNumber(draft.phoneNumber) : null;

  if (phoneProblem) {
    return {
      success: false,
      message: phoneProblem,
    };
  }

  const { token, tokenHash } = createInviteToken();

  const invite = await prisma.$transaction(async (transaction) => {
    const created = await transaction.modelInvite.create({
      data: {
        tokenHash,
        expiresAt: getInviteExpiry(),
        ...draftData(draft, location),
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

export type UpdateInviteResult = { success: true } | { success: false; message: string };

/** Changes the draft of an open invite; the link stays the same. */
export async function updateInvite(inviteId: string, draft: InviteDraft, location: ResolvedLocation, actorId: string): Promise<UpdateInviteResult> {
  const phoneProblem = draft.phoneNumber ? await checkPhoneNumber(draft.phoneNumber, inviteId) : null;

  if (phoneProblem) {
    return {
      success: false,
      message: phoneProblem,
    };
  }

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.modelInvite.updateMany({
      where: {
        id: inviteId,
        status: "OPEN",
      },
      data: draftData(draft, location),
    });

    if (updated.count === 0) {
      return {
        success: false as const,
        message: "Diese Einladung ist nicht mehr offen und kann nicht bearbeitet werden.",
      };
    }

    await logAdminAction(transaction, {
      actorId,
      action: "INVITE_UPDATED",
      targetType: "ModelInvite",
      targetId: inviteId,
      metadata: {
        displayName: draft.displayName,
      },
    });

    return {
      success: true as const,
    };
  });
}
