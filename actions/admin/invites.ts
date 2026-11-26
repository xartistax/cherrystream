"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminAccess } from "@/lib/access";
import { logAdminAction } from "@/lib/admin/audit";
import { buildCreatedInvite, createInvite, type CreatedInvite, updateInvite } from "@/lib/invites/create-invite";
import { inviteDraftSchema, resolveInviteLocation } from "@/lib/invites/draft";
import { createInviteToken, getInviteExpiry } from "@/lib/invites/token";
import { prisma } from "@/lib/prisma";

export type InviteActionState = {
  success: boolean;
  message?: string;
  invites?: CreatedInvite[];
};

function getText(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function getList(formData: FormData, key: string): string[] {
  return formData.getAll(key).filter((value): value is string => typeof value === "string" && value.length > 0);
}

/** The create and the edit form share the same fields. */
async function parseInviteForm(formData: FormData) {
  const parsed = inviteDraftSchema.safeParse({
    displayName: getText(formData, "displayName"),
    bio: getText(formData, "bio"),
    phoneNumber: getText(formData, "phoneNumber"),
    whatsappEnabled: formData.get("whatsappEnabled") === "on",
    signalNumber: getText(formData, "signalNumber"),
    contactNote: getText(formData, "contactNote"),
    telegramUsername: getText(formData, "telegramUsername"),
    instagram: getText(formData, "instagram"),
    website: getText(formData, "website"),
    sourceNote: getText(formData, "sourceNote"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe.",
    } as const;
  }

  const location = await resolveInviteLocation({
    cantonId: getText(formData, "cantonId") || null,
    cityId: getText(formData, "cityId") || null,
    categoryIds: getList(formData, "categoryIds"),
    serviceIds: getList(formData, "serviceIds"),
  });

  return {
    draft: parsed.data,
    location,
  } as const;
}

export async function createInviteAction(_previousState: InviteActionState, formData: FormData): Promise<InviteActionState> {
  const access = await getAdminAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  const form = await parseInviteForm(formData);

  if ("error" in form) {
    return {
      success: false,
      message: form.error,
    };
  }

  const result = await createInvite(form.draft, form.location, access.userId);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  revalidatePath("/admin/invites");

  return {
    success: true,
    invites: [result.invite],
  };
}

export async function updateInviteAction(_previousState: InviteActionState, formData: FormData): Promise<InviteActionState> {
  const access = await getAdminAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  const inviteId = z.string().min(1).safeParse(formData.get("inviteId"));
  const form = await parseInviteForm(formData);

  if (!inviteId.success || "error" in form) {
    return {
      success: false,
      message: "error" in form ? form.error : "Die Einladung wurde nicht gefunden.",
    };
  }

  const result = await updateInvite(inviteId.data, form.draft, form.location, access.userId);

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  revalidatePath("/admin/invites");
  revalidatePath(`/admin/invites/${inviteId.data}`);

  return {
    success: true,
    message: "Änderungen gespeichert. Der Link bleibt gleich.",
  };
}

export async function renewInviteLinkAction(_previousState: InviteActionState, formData: FormData): Promise<InviteActionState> {
  const access = await getAdminAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  const inviteId = z.string().min(1).parse(formData.get("inviteId"));
  const { token, tokenHash } = createInviteToken();

  const invite = await prisma.$transaction(async (transaction) => {
    const renewed = await transaction.modelInvite.updateMany({
      where: {
        id: inviteId,
        status: "OPEN",
      },
      data: {
        tokenHash,
        expiresAt: getInviteExpiry(),
      },
    });

    if (renewed.count === 0) {
      return null;
    }

    const updated = await transaction.modelInvite.findUniqueOrThrow({
      where: {
        id: inviteId,
      },
      select: {
        id: true,
        displayName: true,
        phoneNumber: true,
      },
    });

    await logAdminAction(transaction, {
      actorId: access.userId,
      action: "INVITE_RENEWED",
      targetType: "ModelInvite",
      targetId: inviteId,
      metadata: {
        displayName: updated.displayName,
      },
    });

    return updated;
  });

  if (!invite) {
    return {
      success: false,
      message: "Die Einladung ist nicht mehr offen.",
    };
  }

  revalidatePath("/admin/invites");

  return {
    success: true,
    invites: [buildCreatedInvite(invite.id, invite.displayName, invite.phoneNumber, token)],
  };
}

export async function revokeInviteAction(formData: FormData): Promise<void> {
  const access = await getAdminAccess();

  if (!access.allowed) {
    throw new Error(access.message);
  }

  const inviteId = z.string().min(1).parse(formData.get("inviteId"));

  await prisma.$transaction(async (transaction) => {
    const invite = await transaction.modelInvite.findUnique({
      where: {
        id: inviteId,
      },
      select: {
        status: true,
        displayName: true,
      },
    });

    if (!invite || invite.status !== "OPEN") {
      return;
    }

    await transaction.modelInvite.delete({
      where: {
        id: inviteId,
      },
    });

    await logAdminAction(transaction, {
      actorId: access.userId,
      action: "INVITE_REVOKED",
      targetType: "ModelInvite",
      targetId: inviteId,
      metadata: {
        displayName: invite.displayName,
      },
    });
  });

  revalidatePath("/admin/invites");
}
