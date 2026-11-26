"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminAccess } from "@/lib/access";
import { adminAlertEvents, formatAlert } from "@/lib/admin-alerts/alerts";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram/client";

export type AlertActionResult = {
  success: boolean;
  message?: string;
};

const eventSchema = z.enum(["VERIFICATION_SUBMITTED", "REPORT_CREATED", "INVITE_CLAIMED", "MODEL_REGISTERED"]);

export async function setAlertEnabledAction(event: string, enabled: boolean): Promise<AlertActionResult> {
  const access = await getAdminAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  const parsed = eventSchema.safeParse(event);

  if (!parsed.success) {
    return {
      success: false,
      message: "Unbekannte Benachrichtigung.",
    };
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.adminAlertSetting.upsert({
      where: {
        event: parsed.data,
      },
      create: {
        event: parsed.data,
        enabled,
        updatedById: access.userId,
      },
      update: {
        enabled,
        updatedById: access.userId,
      },
    });

    await logAdminAction(transaction, {
      actorId: access.userId,
      action: "ALERT_SETTING_CHANGED",
      targetType: "AdminAlertSetting",
      targetId: parsed.data,
      metadata: {
        displayName: `${adminAlertEvents[parsed.data].label}: ${enabled ? "an" : "aus"}`,
      },
    });
  });

  revalidatePath("/admin/notifications");

  return {
    success: true,
  };
}

export async function sendTestAlertAction(): Promise<AlertActionResult> {
  const access = await getAdminAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  const result = await sendTelegramMessage(
    formatAlert("Testnachricht", {
      lines: ["Die Telegram-Benachrichtigungen von CherryStream funktionieren."],
      path: "/admin/notifications",
    }),
  );

  return result.ok
    ? {
        success: true,
        message: "Testnachricht gesendet. Schau in eure Telegram-Gruppe.",
      }
    : {
        success: false,
        message: `Senden fehlgeschlagen: ${result.error}`,
      };
}
