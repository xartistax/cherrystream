export const ECONOMY = {
  creditValueRappen: 10,

  platformFeeBasisPoints: 2_000,

  minimumPayoutRappen: 10_000,

  // Prices from docs/credits-boosts.md: CHF 0.10 per credit in the smallest package, up to 60 % bonus.
  creditPackages: [
    {
      id: "credits_100",
      paidCredits: 100,
      bonusCredits: 0,
      priceRappen: 1_000,
    },
    {
      id: "credits_300",
      paidCredits: 250,
      bonusCredits: 50,
      priceRappen: 2_500,
    },
    {
      id: "credits_700",
      paidCredits: 500,
      bonusCredits: 200,
      priceRappen: 5_000,
    },
    {
      id: "credits_1600",
      paidCredits: 1_000,
      bonusCredits: 600,
      priceRappen: 10_000,
    },
  ] as const,

  unlockPrices: [10, 25, 50, 75, 100, 150, 250, 500] as const,

  tipAmounts: [10, 25, 50, 100, 250] as const,

  /** Credits invited models receive once their profile is approved (4 bumps). */
  starterCredits: 100,

  /** Minimum time between two manual bumps, so nobody blocks the top of the list. */
  bumpCooldownMinutes: 30,

  boostOptions: [
    {
      id: "bump",
      type: "BUMP",
      credits: 25,
      label: "Hochschieben",
      description: "Dein Profil springt sofort an die Spitze der Liste.",
    },
    {
      id: "auto_bump_1d",
      type: "AUTO_BUMP",
      credits: 200,
      durationHours: 24,
      intervalMinutes: 120,
      label: "Auto-Hochschieben, 1 Tag",
      description: "Alle 2 Stunden automatisch an die Spitze, 12-mal.",
    },
    {
      id: "auto_bump_7d",
      type: "AUTO_BUMP",
      credits: 750,
      durationHours: 168,
      intervalMinutes: 240,
      label: "Auto-Hochschieben, 7 Tage",
      description: "Alle 4 Stunden automatisch an die Spitze, 42-mal.",
    },
    {
      id: "highlight_1d",
      type: "HIGHLIGHT",
      credits: 50,
      durationHours: 24,
      label: "Hervorhebung, 1 Tag",
      description: "Farbiger Rahmen und Badge „Top“ auf deiner Karte.",
    },
    {
      id: "highlight_7d",
      type: "HIGHLIGHT",
      credits: 200,
      durationHours: 168,
      label: "Hervorhebung, 7 Tage",
      description: "Farbiger Rahmen und Badge „Top“ auf deiner Karte.",
    },
    {
      id: "highlight_30d",
      type: "HIGHLIGHT",
      credits: 600,
      durationHours: 720,
      label: "Hervorhebung, 30 Tage",
      description: "Farbiger Rahmen und Badge „Top“ auf deiner Karte.",
    },
  ] as const,
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

export function getCreditPackageName(paidCredits: number, bonusCredits: number) {
  const total = calculateCreditPackageTotal(paidCredits, bonusCredits);

  return `${total} Credits`;
}

export type CreditPackage = (typeof ECONOMY.creditPackages)[number];
export type CreditPackageId = CreditPackage["id"];

export function getCreditPackage(packageId: string): CreditPackage | undefined {
  return ECONOMY.creditPackages.find((creditPackage) => creditPackage.id === packageId);
}

export type BoostOption = (typeof ECONOMY.boostOptions)[number];
export type BoostOptionId = BoostOption["id"];

export function getBoostOption(optionId: string): BoostOption | undefined {
  return ECONOMY.boostOptions.find((option) => option.id === optionId);
}
