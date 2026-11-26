"use server";

import { revalidatePath } from "next/cache";

import { getAdminAccess } from "@/lib/access";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";
import { createPreviewKey, getComingSoonSetting, saveComingSoonSetting } from "@/lib/site-settings";

export type SiteActionResult = {
  success: boolean;
  message?: string;
};

async function logChange(actorId: string, displayName: string) {
  await prisma.$transaction(async (transaction) => {
    await logAdminAction(transaction, {
      actorId,
      action: "SITE_SETTING_CHANGED",
      targetType: "SiteSetting",
      targetId: "comingSoon",
      metadata: {
        displayName,
      },
    });
  });
}

export async function setComingSoonAction(enabled: boolean): Promise<SiteActionResult> {
  const access = await getAdminAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  const current = await getComingSoonSetting({ fresh: true });

  await saveComingSoonSetting({ enabled, previewKey: current.previewKey || createPreviewKey() }, access.userId);
  await logChange(access.userId, `Coming-Soon-Modus ${enabled ? "an" : "aus"}`);

  revalidatePath("/admin/site");

  return {
    success: true,
  };
}

/** A new key invalidates the old preview link and every cookie it handed out. */
export async function rotatePreviewKeyAction(): Promise<SiteActionResult> {
  const access = await getAdminAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  const current = await getComingSoonSetting({ fresh: true });

  await saveComingSoonSetting({ enabled: current.enabled, previewKey: createPreviewKey() }, access.userId);
  await logChange(access.userId, "Vorschau-Link erneuert");

  revalidatePath("/admin/site");

  return {
    success: true,
    message: "Neuer Vorschau-Link erstellt. Der alte funktioniert nicht mehr.",
  };
}
