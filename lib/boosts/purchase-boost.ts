import "server-only";

import { WalletBalanceType, WalletTransactionType } from "@/generated/prisma/client";
import { ECONOMY, type BoostOption } from "@/lib/economy";
import { prisma } from "@/lib/prisma";
import { createWalletTransactionInTx } from "@/lib/wallet/create-transaction";

const HOUR_MS = 60 * 60 * 1000;

export class BoostCooldownError extends Error {
  constructor(readonly availableAt: Date) {
    super("Bump cooldown is still running.");
    this.name = "BoostCooldownError";
  }
}

/**
 * Debits the credits and applies the boost in one transaction, so a boost never exists without its payment.
 * The request ID makes a double click book only once.
 */
export async function purchaseBoost(userId: string, option: BoostOption, requestId: string) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const idempotencyKey = `boost:${userId}:${requestId}`;

    // A retried request returns the boost it already booked instead of running into the cooldown.
    const bookedBoost = await tx.boost.findFirst({
      where: {
        transaction: {
          idempotencyKey,
        },
      },
    });

    if (bookedBoost) {
      return bookedBoost;
    }

    if (option.type === "BUMP") {
      const lastBump = await tx.boost.findFirst({
        where: {
          userId,
          type: "BUMP",
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          createdAt: true,
        },
      });

      const availableAt = lastBump ? new Date(lastBump.createdAt.getTime() + ECONOMY.bumpCooldownMinutes * 60 * 1000) : now;

      if (availableAt > now) {
        throw new BoostCooldownError(availableAt);
      }
    }

    const transaction = await createWalletTransactionInTx(tx, {
      userId,
      type: WalletTransactionType.BOOST_PURCHASE,
      balanceType: WalletBalanceType.USER_CREDITS,
      amount: -option.credits,
      idempotencyKey,
      description: option.label,
      metadata: {
        option: option.id,
      },
    });

    if (option.type === "BUMP") {
      await tx.profile.update({
        where: {
          userId,
        },
        data: {
          bumpedAt: now,
        },
      });

      return tx.boost.create({
        data: {
          userId,
          type: "BUMP",
          option: option.id,
          startsAt: now,
          endsAt: now,
          credits: option.credits,
          transactionId: transaction.id,
        },
      });
    }

    if (option.type === "HIGHLIGHT") {
      const profile = await tx.profile.findUniqueOrThrow({
        where: {
          userId,
        },
        select: {
          highlightUntil: true,
        },
      });

      // Buying again extends a running highlight instead of overlapping it.
      const startsAt = profile.highlightUntil && profile.highlightUntil > now ? profile.highlightUntil : now;
      const endsAt = new Date(startsAt.getTime() + option.durationHours * HOUR_MS);

      await tx.profile.update({
        where: {
          userId,
        },
        data: {
          highlightUntil: endsAt,
        },
      });

      return tx.boost.create({
        data: {
          userId,
          type: "HIGHLIGHT",
          option: option.id,
          startsAt,
          endsAt,
          credits: option.credits,
          transactionId: transaction.id,
        },
      });
    }

    // Auto bumps queue up behind a running one, so every bought bump is used.
    const runningAutoBump = await tx.boost.findFirst({
      where: {
        userId,
        type: "AUTO_BUMP",
        endsAt: {
          gt: now,
        },
      },
      orderBy: {
        endsAt: "desc",
      },
      select: {
        endsAt: true,
      },
    });

    const startsAt = runningAutoBump?.endsAt ?? now;
    const endsAt = new Date(startsAt.getTime() + option.durationHours * HOUR_MS);

    if (!runningAutoBump) {
      await tx.profile.update({
        where: {
          userId,
        },
        data: {
          bumpedAt: now,
        },
      });
    }

    return tx.boost.create({
      data: {
        userId,
        type: "AUTO_BUMP",
        option: option.id,
        startsAt,
        endsAt,
        intervalMinutes: option.intervalMinutes,
        credits: option.credits,
        transactionId: transaction.id,
      },
    });
  });
}
