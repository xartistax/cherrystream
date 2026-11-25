"use server";

import { revalidatePath } from "next/cache";

import { InsufficientWalletBalanceError } from "@/lib/wallet/errors";
import { InvalidPremiumPriceError, OwnPostUnlockError, PostIsNotPremiumError, PostNotFoundError } from "@/lib/premium/errors";
import { unlockPost } from "@/lib/premium/unlock-post";
import { auth } from "@/lib/auth";
import { paymentsEnabled } from "@/lib/features";

type UnlockPostActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

export async function unlockPostAction(postId: string): Promise<UnlockPostActionResult> {
  if (!paymentsEnabled) {
    return {
      success: false,
      error: "Premium-Inhalte sind noch nicht verfügbar.",
    };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Du musst angemeldet sein.",
    };
  }

  try {
    await unlockPost(session.user.id, postId);

    revalidatePath(`/profile/${session.user.username}`);

    return {
      success: true,
    };
  } catch (error: unknown) {
    if (error instanceof InsufficientWalletBalanceError) {
      return {
        success: false,
        error: "Du hast nicht genügend Credits.",
      };
    }

    if (error instanceof OwnPostUnlockError) {
      return {
        success: false,
        error: "Du kannst deinen eigenen Beitrag nicht freischalten.",
      };
    }

    if (error instanceof PostNotFoundError || error instanceof PostIsNotPremiumError || error instanceof InvalidPremiumPriceError) {
      return {
        success: false,
        error: "Dieser Beitrag kann nicht freigeschaltet werden.",
      };
    }

    console.error("Failed to unlock post:", error);

    return {
      success: false,
      error: "Freischaltung fehlgeschlagen.",
    };
  }
}
