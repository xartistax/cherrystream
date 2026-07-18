import "server-only";

import { InvalidWalletAmountError } from "@/lib/wallet/errors";
import { createWalletTransaction, type WalletTransactionResult } from "@/lib/wallet/create-transaction";
import type { DebitWalletInput } from "@/lib/wallet/types";

export async function debitWallet(input: DebitWalletInput): Promise<WalletTransactionResult> {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new InvalidWalletAmountError();
  }

  return createWalletTransaction({
    ...input,
    amount: -input.amount,
  });
}
