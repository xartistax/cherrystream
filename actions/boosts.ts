"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCreatorAccess } from "@/lib/access";
import { BoostCooldownError, purchaseBoost } from "@/lib/boosts/purchase-boost";
import { getBoostOption } from "@/lib/economy";
import { prisma } from "@/lib/prisma";
import { InsufficientWalletBalanceError } from "@/lib/wallet/errors";

export type BoostActionResult = {
  success: boolean;
  message?: string;
};

const boostInputSchema = z.object({
  optionId: z.string().min(1),
  requestId: z.uuid(),
});

export async function purchaseBoostAction(optionId: string, requestId: string): Promise<BoostActionResult> {
  const access = await getCreatorAccess({ requireActive: true });

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  const parsed = boostInputSchema.safeParse({ optionId, requestId });
  const option = parsed.success ? getBoostOption(parsed.data.optionId) : undefined;

  if (!parsed.success || !option) {
    return {
      success: false,
      message: "Diesen Boost gibt es nicht.",
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: access.userId,
    },
    select: {
      username: true,
      profile: {
        select: {
          isPublic: true,
        },
      },
    },
  });

  if (!user?.profile?.isPublic) {
    return {
      success: false,
      message: "Hochschieben und Hervorheben wirken nur, wenn dein Inserat online ist. Stell es in den Einstellungen online.",
    };
  }

  try {
    await purchaseBoost(access.userId, option, parsed.data.requestId);
  } catch (error) {
    if (error instanceof InsufficientWalletBalanceError) {
      return {
        success: false,
        message: `Dafür brauchst du ${option.credits} Credits.`,
      };
    }

    if (error instanceof BoostCooldownError) {
      const time = error.availableAt.toLocaleTimeString("de-CH", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Zurich",
      });

      return {
        success: false,
        message: `Du kannst ab ${time} Uhr wieder hochschieben.`,
      };
    }

    console.error("Boost purchase failed:", error);

    return {
      success: false,
      message: "Der Boost konnte nicht gebucht werden. Bitte versuche es erneut.",
    };
  }

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/visibility");
  revalidatePath(`/profile/${user.username}`);

  return {
    success: true,
  };
}
