"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const notificationSettingSchema = z.object({
  setting: z.enum(["marketingEmails", "accountEmails", "newFollowers", "postLikes", "profileViews", "contactClicks"]),
  enabled: z.boolean(),
});

export type NotificationSetting = z.infer<typeof notificationSettingSchema>["setting"];

export type UpdateNotificationSettingResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export async function updateNotificationSetting(setting: NotificationSetting, enabled: boolean): Promise<UpdateNotificationSettingResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Deine Sitzung ist abgelaufen.",
    };
  }

  const parsed = notificationSettingSchema.safeParse({
    setting,
    enabled,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Ungültige Einstellung.",
    };
  }

  try {
    await prisma.notificationSettings.upsert({
      where: {
        userId: session.user.id,
      },
      create: {
        userId: session.user.id,
        [parsed.data.setting]: parsed.data.enabled,
      },
      update: {
        [parsed.data.setting]: parsed.data.enabled,
      },
    });

    revalidatePath("/settings/notifications");

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      error: "Die Einstellung konnte nicht gespeichert werden.",
    };
  }
}
