import "server-only";

import { WalletBalanceType, WalletTransactionType, type Prisma } from "@/generated/prisma/client";
import { ECONOMY } from "@/lib/economy";
import { createWalletTransactionInTx } from "@/lib/wallet/create-transaction";

/**
 * Books the starter credits for a model who came in through an invite. Self-registered models get none.
 * The fixed key books them once, even after a later re-approval. Returns whether credits were granted.
 */
export async function grantStarterCreditsInTx(tx: Prisma.TransactionClient, userId: string): Promise<boolean> {
  const invite = await tx.modelInvite.findUnique({
    where: {
      claimedById: userId,
    },
    select: {
      id: true,
    },
  });

  if (!invite) {
    return false;
  }

  await createWalletTransactionInTx(tx, {
    userId,
    type: WalletTransactionType.STARTER_CREDIT,
    balanceType: WalletBalanceType.USER_CREDITS,
    amount: ECONOMY.starterCredits,
    idempotencyKey: `starter-credit:${userId}`,
    description: "Willkommensguthaben für eingeladene Models",
    referenceId: invite.id,
  });

  return true;
}
