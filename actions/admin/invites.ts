"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminAccess } from "@/lib/access";
import { logAdminAction } from "@/lib/admin/audit";
import { buildCreatedInvite, createInvite, type CreatedInvite } from "@/lib/invites/create-invite";
import { inviteDraftSchema, resolveInviteLocation } from "@/lib/invites/draft";
import { createInviteToken, getInviteExpiry } from "@/lib/invites/token";
import { prisma } from "@/lib/prisma";

export type InviteActionState = {
  success: boolean;
  message?: string;
  invites?: CreatedInvite[];
  failures?: Array<{
    row: number;
    displayName: string;
    message: string;
  }>;
};

const MAX_IMPORT_ROWS = 200;

function getText(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

export async function createInviteAction(_previousState: InviteActionState, formData: FormData): Promise<InviteActionState> {
  const access = await getAdminAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  const parsed = inviteDraftSchema.safeParse({
    displayName: getText(formData, "displayName"),
    bio: getText(formData, "bio"),
    phoneNumber: getText(formData, "phoneNumber"),
    whatsappEnabled: formData.get("whatsappEnabled") === "on",
    telegramUsername: getText(formData, "telegramUsername"),
    instagram: getText(formData, "instagram"),
    website: getText(formData, "website"),
    sourceNote: getText(formData, "sourceNote"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Ungültige Eingabe.",
    };
  }

  const location = await resolveInviteLocation({
    cantonId: getText(formData, "cantonId") || null,
    cityId: getText(formData, "cityId") || null,
    categoryIds: formData.getAll("categoryIds").filter((value): value is string => typeof value === "string"),
  });

  const result = await createInvite(parsed.data, location, access.userId);

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

/** Format produced by the external scraper. Slugs are resolved against the database. */
const importRowSchema = z.object({
  displayName: z.string(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.boolean().optional(),
  telegram: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().optional(),
  canton: z.string().optional(),
  city: z.string().optional(),
  categories: z.array(z.string()).optional(),
  source: z.string().optional(),
});

export async function importInvitesAction(_previousState: InviteActionState, formData: FormData): Promise<InviteActionState> {
  const access = await getAdminAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  let rows: unknown;

  try {
    rows = JSON.parse(getText(formData, "json") ?? "");
  } catch {
    return {
      success: false,
      message: "Das ist kein gültiges JSON.",
    };
  }

  const parsedRows = z.array(importRowSchema).max(MAX_IMPORT_ROWS, `Maximal ${MAX_IMPORT_ROWS} Einträge pro Import.`).safeParse(rows);

  if (!parsedRows.success) {
    const issue = parsedRows.error.issues[0];

    return {
      success: false,
      message: issue ? `${issue.path.length > 0 ? `Eintrag ${issue.path.join(".")}: ` : ""}${issue.message}` : "Ungültiges Format.",
    };
  }

  const invites: CreatedInvite[] = [];
  const failures: NonNullable<InviteActionState["failures"]> = [];

  // Sequential on purpose: duplicate checks must see invites created by earlier rows of the same import.
  for (const [index, row] of parsedRows.data.entries()) {
    const draft = inviteDraftSchema.safeParse({
      displayName: row.displayName,
      bio: row.bio,
      phoneNumber: row.phone,
      whatsappEnabled: row.whatsapp ?? Boolean(row.phone),
      telegramUsername: row.telegram,
      instagram: row.instagram,
      website: row.website,
      sourceNote: row.source,
    });

    if (!draft.success) {
      failures.push({
        row: index + 1,
        displayName: row.displayName,
        message: draft.error.issues[0]?.message ?? "Ungültiger Eintrag.",
      });
      continue;
    }

    const location = await resolveInviteLocation({
      cantonSlug: row.canton,
      citySlug: row.city,
      categorySlugs: row.categories,
    });

    const result = await createInvite(draft.data, location, access.userId);

    if (result.success) {
      invites.push(result.invite);
    } else {
      failures.push({
        row: index + 1,
        displayName: row.displayName,
        message: result.message,
      });
    }
  }

  revalidatePath("/admin/invites");

  return {
    success: invites.length > 0,
    message: `${invites.length} Einladung(en) erstellt, ${failures.length} übersprungen.`,
    invites,
    failures,
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
