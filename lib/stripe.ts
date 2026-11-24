import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripe(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY fehlt.");
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2026-08-26.dahlia",
  });

  return stripeClient;
}
