"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { WalletBalanceType, WalletTransactionType } from "@/generated/prisma/client";
import { getAdminAccess } from "@/lib/access";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";
import { createWalletTransactionInTx } from "@/lib/wallet/create-transaction";
import { InsufficientWalletBalanceError } from "@/lib/wallet/errors";

export type AdjustCreditsState = {
  success: boolean;
  message?: string;
};

const MAX_ADJUSTMENT = 10_000;

const adjustSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce
    .number()
    .int("Nur ganze Credits.")
    .refine((value) => value !== 0, "Der Betrag darf nicht 0 sein.")
    .refine((value) => Math.abs(value) <= MAX_ADJUSTMENT, `Höchstens ${MAX_ADJUSTMENT} Credits pro Buchung.`),
  reason: z.string().trim().min(5, "Bitte gib einen Grund an (mindestens 5 Zeichen).").max(200),
});

/** Credits or debits a model's balance manually, e.g. as a goodwill gesture or to correct a booking. */
export async function adjustCreditsAction(_previousState: AdjustCreditsState, formData: FormData): Promise<AdjustCreditsState> {
  const access = await getAdminAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  const parsed = adjustSchema.safeParse({
    userId: formData.get("userId"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Ungültige Eingabe.",
    };
  }

  const { userId, amount, reason } = parsed.data;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      role: true,
      username: true,
    },
  });

  if (!user || user.role !== "MODEL") {
    return {
      success: false,
      message: "Credits gibt es nur für Models.",
    };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const walletTransaction = await createWalletTransactionInTx(transaction, {
        userId,
        type: WalletTransactionType.ADJUSTMENT,
        balanceType: WalletBalanceType.USER_CREDITS,
        amount,
        idempotencyKey: `admin-adjustment:${randomUUID()}`,
        description: reason,
        metadata: {
          adminId: access.userId,
        },
      });

      await logAdminAction(transaction, {
        actorId: access.userId,
        action: "CREDITS_ADJUSTED",
        targetType: "User",
        targetId: userId,
        metadata: {
          username: user.username,
          amount,
          reason,
          transactionId: walletTransaction.id,
        },
      });
    });
  } catch (error) {
    if (error instanceof InsufficientWalletBalanceError) {
      return {
        success: false,
        message: "So viele Credits hat das Model nicht.",
      };
    }

    throw error;
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");

  return {
    success: true,
    message: `${amount > 0 ? "+" : ""}${amount} Credits gebucht.`,
  };
}
