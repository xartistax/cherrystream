/**
 * Payments (credit purchases, premium posts, unlocks) are disabled in v0.0.1
 * until a payment provider for adult content is contracted.
 * NEXT_PUBLIC_ so client components (composer, navigation) can read it too.
 */
export const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";
