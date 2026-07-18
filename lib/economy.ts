export const ECONOMY = {
  creditValueRappen: 10,

  platformFeeBasisPoints: 2_000,

  minimumPayoutRappen: 10_000,

  creditPackages: [
    {
      id: "credits_100",
      paidCredits: 100,
      bonusCredits: 0,
      priceRappen: 1_000,
    },
    {
      id: "credits_250",
      paidCredits: 250,
      bonusCredits: 20,
      priceRappen: 2_500,
    },
    {
      id: "credits_500",
      paidCredits: 500,
      bonusCredits: 75,
      priceRappen: 5_000,
    },
    {
      id: "credits_1000",
      paidCredits: 1_000,
      bonusCredits: 200,
      priceRappen: 10_000,
    },
    {
      id: "credits_2500",
      paidCredits: 2_500,
      bonusCredits: 700,
      priceRappen: 25_000,
    },
    {
      id: "credits_5000",
      paidCredits: 5_000,
      bonusCredits: 1_800,
      priceRappen: 50_000,
    },
  ] as const,

  unlockPrices: [10, 25, 50, 75, 100, 150, 250, 500] as const,

  tipAmounts: [10, 25, 50, 100, 250] as const,

  boosts: {
    discovery24h: 500,
    discovery72h: 1_250,
    discovery7d: 2_500,
  },
} as const;

export function calculateCreditPackageTotal(paidCredits: number, bonusCredits: number): number {
  return paidCredits + bonusCredits;
}

export function creditsToRappen(credits: number): number {
  return credits * ECONOMY.creditValueRappen;
}

export function calculatePlatformSplit(credits: number): {
  grossRappen: number;
  platformRappen: number;
  creatorRappen: number;
} {
  const grossRappen = creditsToRappen(credits);

  const platformRappen = Math.round((grossRappen * ECONOMY.platformFeeBasisPoints) / 10_000);

  return {
    grossRappen,
    platformRappen,
    creatorRappen: grossRappen - platformRappen,
  };
}
