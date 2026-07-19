import { WalletBalanceType } from "@/generated/prisma/client";

type WalletState = {
  userCredits: number;
  earningsRappen: number;
};

export function applyBalanceChange(wallet: WalletState, balanceType: WalletBalanceType, amount: number): WalletState {
  switch (balanceType) {
    case WalletBalanceType.USER_CREDITS:
      return {
        ...wallet,
        userCredits: wallet.userCredits + amount,
      };

    case WalletBalanceType.EARNINGS:
      return {
        ...wallet,
        earningsRappen: wallet.earningsRappen + amount,
      };
  }

  throw new Error(`Unsupported balance type: ${balanceType}`);
}

export function hasEnoughBalance(wallet: WalletState, balanceType: WalletBalanceType, amount: number): boolean {
  if (amount >= 0) {
    return true;
  }

  switch (balanceType) {
    case WalletBalanceType.USER_CREDITS:
      return wallet.userCredits >= Math.abs(amount);

    case WalletBalanceType.EARNINGS:
      return wallet.earningsRappen >= Math.abs(amount);
  }

  throw new Error(`Unsupported balance type: ${balanceType}`);
}
