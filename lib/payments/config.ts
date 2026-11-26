import "server-only";

import type { PaymentMode, PaymentProvider } from "@/generated/prisma/enums";

/**
 * Platform-wide payment mode for credit purchases by models (docs/credits-boosts.md):
 * PAYMENTS_MODE=test uses sandbox credentials and the simulated checkout, "live" real money, unset hides purchases.
 * Separate from NEXT_PUBLIC_PAYMENTS_ENABLED, which covers the (hidden) premium purchases of members.
 */
export function getPaymentMode(): PaymentMode | null {
  switch (process.env.PAYMENTS_MODE?.trim().toLowerCase()) {
    case "test":
      return "TEST";
    case "live":
      return "LIVE";
    default:
      return null;
  }
}

/** Providers a model can pay with in the current mode. Live providers are added once a contract is signed. */
export function getAvailableProviders(mode: PaymentMode | null = getPaymentMode()): PaymentProvider[] {
  return mode === "TEST" ? ["TEST"] : [];
}

export function isCreditPurchaseEnabled(): boolean {
  return getAvailableProviders().length > 0;
}

export const paymentProviderLabels: Record<PaymentProvider, string> = {
  TEST: "Testzahlung",
};
