import "server-only";

import { InvalidWalletAmountError } from "@/lib/wallet/errors";
import { createWalletTransaction, type WalletTransactionResult } from "@/lib/wallet/create-transaction";
import type { CreditWalletInput } from "@/lib/wallet/types";

export async function creditWallet(input: CreditWalletInput): Promise<WalletTransactionResult> {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new InvalidWalletAmountError();
  }

  return createWalletTransaction({
    ...input,
    amount: input.amount,
  });
}
