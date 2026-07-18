import { Prisma, WalletBalanceType, WalletTransactionType } from "@/generated/prisma/client";

export type WalletTransactionInput = {
  userId: string;
  type: WalletTransactionType;
  balanceType: WalletBalanceType;
  amount: number;
  idempotencyKey: string;
  description?: string;
  referenceId?: string;
  metadata?: Prisma.InputJsonValue;
};

export type CreditWalletInput = Omit<WalletTransactionInput, "amount"> & {
  amount: number;
};

export type DebitWalletInput = Omit<WalletTransactionInput, "amount"> & {
  amount: number;
};
