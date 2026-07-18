import { WalletBalanceType } from "@/generated/prisma/client";

type WalletState = {
  userCredits: number;
  creatorCredits: number;
  earningsRappen: number;
};

export function applyBalanceChange(wallet: WalletState, balanceType: WalletBalanceType, amount: number): WalletState {
  switch (balanceType) {
    case WalletBalanceType.USER_CREDITS:
      return {
        ...wallet,
        userCredits: wallet.userCredits + amount,
      };

    case WalletBalanceType.CREATOR_CREDITS:
      return {
        ...wallet,
        creatorCredits: wallet.creatorCredits + amount,
      };

    case WalletBalanceType.EARNINGS:
      return {
        ...wallet,
        earningsRappen: wallet.earningsRappen + amount,
      };
  }
}

export function hasEnoughBalance(wallet: WalletState, balanceType: WalletBalanceType, amount: number): boolean {
  if (amount >= 0) {
    return true;
  }

  switch (balanceType) {
    case WalletBalanceType.USER_CREDITS:
      return wallet.userCredits >= Math.abs(amount);

    case WalletBalanceType.CREATOR_CREDITS:
      return wallet.creatorCredits >= Math.abs(amount);

    case WalletBalanceType.EARNINGS:
      return wallet.earningsRappen >= Math.abs(amount);
  }
}
