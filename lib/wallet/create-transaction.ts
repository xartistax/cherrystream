import "server-only";

import { Prisma, WalletBalanceType } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { InsufficientWalletBalanceError, InvalidWalletAmountError, WalletIdempotencyConflictError } from "@/lib/wallet/errors";
import type { WalletTransactionInput } from "@/lib/wallet/types";

const MAX_ATTEMPTS = 3;

const transactionSelect = {
  id: true,
  walletId: true,
  type: true,
  balanceType: true,
  amountCredits: true,
  amountRappen: true,
  balanceUserCredits: true,
  balanceCreatorCredits: true,
  balanceEarningsRappen: true,
  description: true,
  metadata: true,
  referenceId: true,
  idempotencyKey: true,
  createdAt: true,
  wallet: {
    select: {
      userId: true,
    },
  },
} satisfies Prisma.WalletTransactionSelect;

export type WalletTransactionResult = Prisma.WalletTransactionGetPayload<{
  select: typeof transactionSelect;
}>;

function validateInput(input: WalletTransactionInput): void {
  if (!input.userId.trim()) {
    throw new Error("User ID is required.");
  }

  if (!input.idempotencyKey.trim()) {
    throw new Error("Idempotency key is required.");
  }

  if (!Number.isSafeInteger(input.amount) || input.amount === 0) {
    throw new InvalidWalletAmountError();
  }
}

function getStoredAmounts(
  balanceType: WalletBalanceType,
  amount: number,
): {
  amountCredits: number | null;
  amountRappen: number | null;
} {
  return balanceType === WalletBalanceType.EARNINGS
    ? {
        amountCredits: null,
        amountRappen: amount,
      }
    : {
        amountCredits: amount,
        amountRappen: null,
      };
}

function getBalanceFilter(balanceType: WalletBalanceType, amount: number): Prisma.WalletWhereInput {
  if (amount > 0) {
    return {};
  }

  const requiredBalance = Math.abs(amount);

  switch (balanceType) {
    case WalletBalanceType.USER_CREDITS:
      return {
        userCredits: {
          gte: requiredBalance,
        },
      };

    case WalletBalanceType.CREATOR_CREDITS:
      return {
        creatorCredits: {
          gte: requiredBalance,
        },
      };

    case WalletBalanceType.EARNINGS:
      return {
        earningsRappen: {
          gte: requiredBalance,
        },
      };
  }
}

function getBalanceUpdate(balanceType: WalletBalanceType, amount: number): Prisma.WalletUpdateManyMutationInput {
  switch (balanceType) {
    case WalletBalanceType.USER_CREDITS:
      return {
        userCredits: {
          increment: amount,
        },
      };

    case WalletBalanceType.CREATOR_CREDITS:
      return {
        creatorCredits: {
          increment: amount,
        },
      };

    case WalletBalanceType.EARNINGS:
      return {
        earningsRappen: {
          increment: amount,
        },
      };
  }
}

function assertIdempotentMatch(transaction: WalletTransactionResult, input: WalletTransactionInput): void {
  const amounts = getStoredAmounts(input.balanceType, input.amount);

  const matches =
    transaction.wallet.userId === input.userId &&
    transaction.type === input.type &&
    transaction.balanceType === input.balanceType &&
    transaction.amountCredits === amounts.amountCredits &&
    transaction.amountRappen === amounts.amountRappen &&
    transaction.referenceId === (input.referenceId ?? null);

  if (!matches) {
    throw new WalletIdempotencyConflictError();
  }
}

export async function createWalletTransactionInTx(tx: Prisma.TransactionClient, input: WalletTransactionInput): Promise<WalletTransactionResult> {
  validateInput(input);

  const existingTransaction = await tx.walletTransaction.findUnique({
    where: {
      idempotencyKey: input.idempotencyKey,
    },
    select: transactionSelect,
  });

  if (existingTransaction) {
    assertIdempotentMatch(existingTransaction, input);
    return existingTransaction;
  }

  await tx.wallet.upsert({
    where: {
      userId: input.userId,
    },
    create: {
      userId: input.userId,
    },
    update: {},
    select: {
      id: true,
    },
  });

  const updateResult = await tx.wallet.updateMany({
    where: {
      userId: input.userId,
      ...getBalanceFilter(input.balanceType, input.amount),
    },
    data: getBalanceUpdate(input.balanceType, input.amount),
  });

  if (updateResult.count !== 1) {
    throw new InsufficientWalletBalanceError();
  }

  const wallet = await tx.wallet.findUniqueOrThrow({
    where: {
      userId: input.userId,
    },
    select: {
      id: true,
      userCredits: true,
      creatorCredits: true,
      earningsRappen: true,
    },
  });

  const amounts = getStoredAmounts(input.balanceType, input.amount);

  return tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: input.type,
      balanceType: input.balanceType,
      amountCredits: amounts.amountCredits,
      amountRappen: amounts.amountRappen,
      balanceUserCredits: wallet.userCredits,
      balanceCreatorCredits: wallet.creatorCredits,
      balanceEarningsRappen: wallet.earningsRappen,
      description: input.description,
      metadata: input.metadata,
      referenceId: input.referenceId,
      idempotencyKey: input.idempotencyKey,
    },
    select: transactionSelect,
  });
}

export async function createWalletTransaction(input: WalletTransactionInput): Promise<WalletTransactionResult> {
  validateInput(input);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction((tx) => createWalletTransactionInTx(tx, input), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error: unknown) {
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < MAX_ATTEMPTS;

      if (!retryable) {
        throw error;
      }
    }
  }

  throw new Error("Wallet transaction failed.");
}
