import "server-only";

import { Prisma, WalletBalanceType, WalletTransactionType } from "@/generated/prisma/client";

import { ECONOMY } from "@/lib/economy";
import { prisma } from "@/lib/prisma";
import { InvalidPremiumPriceError, OwnPostUnlockError, PostIsNotPremiumError, PostNotFoundError } from "@/lib/premium/errors";
import { createWalletTransactionInTx } from "@/lib/wallet/create-transaction";

const MAX_ATTEMPTS = 3;

const postUnlockSelect = {
  id: true,
  userId: true,
  postId: true,
  creditsPaid: true,
  grossRappen: true,
  creatorEarningsRappen: true,
  platformFeeRappen: true,
  buyerTransactionId: true,
  creatorTransactionId: true,
  createdAt: true,
} satisfies Prisma.PostUnlockSelect;

export type UnlockPostResult = Prisma.PostUnlockGetPayload<{
  select: typeof postUnlockSelect;
}>;

function calculateRevenue(priceCredits: number): {
  grossRappen: number;
  creatorEarningsRappen: number;
  platformFeeRappen: number;
} {
  const grossRappen = priceCredits * ECONOMY.creditValueRappen;

  const platformFeeRappen = Math.round((grossRappen * ECONOMY.platformFeeBasisPoints) / 10_000);

  return {
    grossRappen,
    platformFeeRappen,
    creatorEarningsRappen: grossRappen - platformFeeRappen,
  };
}

async function executeUnlock(tx: Prisma.TransactionClient, userId: string, postId: string): Promise<UnlockPostResult> {
  const existingUnlock = await tx.postUnlock.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
    select: postUnlockSelect,
  });

  if (existingUnlock) {
    return existingUnlock;
  }

  const post = await tx.post.findUnique({
    where: {
      id: postId,
    },
    select: {
      id: true,
      authorId: true,
      visibility: true,
      unlockPrice: true,
    },
  });

  if (!post) {
    throw new PostNotFoundError();
  }

  if (post.visibility !== "PREMIUM") {
    throw new PostIsNotPremiumError();
  }

  if (post.unlockPrice === null || !Number.isSafeInteger(post.unlockPrice) || post.unlockPrice <= 0) {
    throw new InvalidPremiumPriceError();
  }

  if (post.authorId === userId) {
    throw new OwnPostUnlockError();
  }

  const priceCredits = post.unlockPrice;
  const revenue = calculateRevenue(priceCredits);

  const buyerTransaction = await createWalletTransactionInTx(tx, {
    userId,
    type: WalletTransactionType.PREMIUM_UNLOCK,
    balanceType: WalletBalanceType.USER_CREDITS,
    amount: -priceCredits,
    idempotencyKey: `post-unlock:buyer:${userId}:${post.id}`,
    referenceId: post.id,
    description: "Premium-Beitrag freigeschaltet",
    metadata: {
      postId: post.id,
      creatorId: post.authorId,
      priceCredits,
    },
  });

  const creatorTransaction = await createWalletTransactionInTx(tx, {
    userId: post.authorId,
    type: WalletTransactionType.PREMIUM_SALE,
    balanceType: WalletBalanceType.EARNINGS,

    amount: revenue.creatorEarningsRappen,
    idempotencyKey: `post-unlock:creator:${userId}:${post.id}`,
    referenceId: post.id,
    description: "Einnahmen aus Premium-Beitrag",
    metadata: {
      postId: post.id,
      buyerId: userId,
      priceCredits,
      grossRappen: revenue.grossRappen,
      platformFeeRappen: revenue.platformFeeRappen,
    },
  });

  return tx.postUnlock.create({
    data: {
      userId,
      postId: post.id,
      creditsPaid: priceCredits,
      grossRappen: revenue.grossRappen,
      creatorEarningsRappen: revenue.creatorEarningsRappen,
      platformFeeRappen: revenue.platformFeeRappen,
      buyerTransactionId: buyerTransaction.id,
      creatorTransactionId: creatorTransaction.id,
    },
    select: postUnlockSelect,
  });
}

export async function unlockPost(userId: string, postId: string): Promise<UnlockPostResult> {
  if (!userId.trim()) {
    throw new Error("User ID is required.");
  }

  if (!postId.trim()) {
    throw new Error("Post ID is required.");
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction((tx) => executeUnlock(tx, userId, postId), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error: unknown) {
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < MAX_ATTEMPTS;

      if (retryable) {
        continue;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existingUnlock = await prisma.postUnlock.findUnique({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
          select: postUnlockSelect,
        });

        if (existingUnlock) {
          return existingUnlock;
        }
      }

      throw error;
    }
  }

  throw new Error("Post unlock failed.");
}
