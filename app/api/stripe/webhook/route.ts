import { Prisma } from "@/generated/prisma/client";
import type Stripe from "stripe";

import { calculateCreditPackageTotal, getCreditPackage } from "@/lib/economy";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

async function fulfillCheckoutSession(checkoutSession: Stripe.Checkout.Session): Promise<void> {
  if (checkoutSession.payment_status !== "paid") {
    return;
  }

  const userId = checkoutSession.metadata?.userId;
  const packageId = checkoutSession.metadata?.packageId;

  if (!userId || !packageId) {
    throw new Error("Stripe-Metadaten fehlen.");
  }

  if (checkoutSession.client_reference_id && checkoutSession.client_reference_id !== userId) {
    throw new Error("Stripe-Benutzerreferenz ist ungültig.");
  }

  const creditPackage = getCreditPackage(packageId);

  if (!creditPackage) {
    throw new Error("Unbekanntes Credit-Paket.");
  }

  if (checkoutSession.currency !== "chf" || checkoutSession.amount_total !== creditPackage.priceRappen) {
    throw new Error("Stripe-Zahlungsbetrag ist ungültig.");
  }

  const totalCredits = calculateCreditPackageTotal(creditPackage.paidCredits, creditPackage.bonusCredits);

  const idempotencyKey = `stripe:checkout:${checkoutSession.id}`;

  try {
    await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!user || user.status !== "ACTIVE") {
        throw new Error("Benutzerkonto ist nicht aktiv.");
      }

      const wallet = await transaction.wallet.upsert({
        where: {
          userId,
        },
        create: {
          userId,
        },
        update: {},
        select: {
          id: true,
        },
      });

      const walletTransaction = await transaction.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "CREDIT_PURCHASE",
          balanceType: "USER_CREDITS",
          amountCredits: totalCredits,
          description: `${totalCredits.toLocaleString("de-CH")} Credits über Stripe gekauft`,
          referenceId: checkoutSession.id,
          idempotencyKey,
          metadata: {
            stripeCheckoutSessionId: checkoutSession.id,
            stripePaymentIntentId:
              typeof checkoutSession.payment_intent === "string" ? checkoutSession.payment_intent : (checkoutSession.payment_intent?.id ?? null),
            packageId: creditPackage.id,
            paidCredits: creditPackage.paidCredits,
            bonusCredits: creditPackage.bonusCredits,
            totalCredits,
            amountRappen: creditPackage.priceRappen,
            currency: checkoutSession.currency,
          },
        },
        select: {
          id: true,
        },
      });

      const updatedWallet = await transaction.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          userCredits: {
            increment: totalCredits,
          },
        },
        select: {
          userCredits: true,
          earningsRappen: true,
        },
      });

      await transaction.walletTransaction.update({
        where: {
          id: walletTransaction.id,
        },
        data: {
          balanceUserCredits: updatedWallet.userCredits,
          balanceEarningsRappen: updatedWallet.earningsRappen,
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return;
    }

    throw error;
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return new Response("Webhook-Konfiguration fehlt.", {
      status: 400,
    });
  }

  const payload = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return new Response("Ungültige Webhook-Signatur.", {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await fulfillCheckoutSession(event.data.object);
        break;
      default:
        break;
    }

    return Response.json({
      received: true,
    });
  } catch (error) {
    console.error("Stripe webhook processing failed", {
      eventId: event.id,
      eventType: event.type,
      error,
    });

    return new Response("Webhook-Verarbeitung fehlgeschlagen.", {
      status: 500,
    });
  }
}
