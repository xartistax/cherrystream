import "server-only";

import { WalletBalanceType, WalletTransactionType, type CreditOrderStatus, type PaymentProvider } from "@/generated/prisma/client";
import { notifyAdmins } from "@/lib/admin-alerts/alerts";
import { calculateCreditPackageTotal, getCreditPackage } from "@/lib/economy";
import { getAvailableProviders, getPaymentMode } from "@/lib/payments/config";
import { prisma } from "@/lib/prisma";
import { createWalletTransactionInTx } from "@/lib/wallet/create-transaction";

export class PaymentUnavailableError extends Error {
  constructor() {
    super("Credit purchases are not available in the current payment mode.");
    this.name = "PaymentUnavailableError";
  }
}

export async function createCreditOrder(userId: string, packageId: string, provider: PaymentProvider) {
  const mode = getPaymentMode();
  const creditPackage = getCreditPackage(packageId);

  if (!mode || !creditPackage || !getAvailableProviders(mode).includes(provider)) {
    throw new PaymentUnavailableError();
  }

  return prisma.creditOrder.create({
    data: {
      userId,
      packageId: creditPackage.id,
      credits: calculateCreditPackageTotal(creditPackage.paidCredits, creditPackage.bonusCredits),
      priceRappen: creditPackage.priceRappen,
      provider,
      mode,
    },
    select: {
      id: true,
    },
  });
}

/**
 * Marks a pending order as paid and books its credits in one transaction. Called by the provider's
 * confirmation (webhook, or the simulated checkout in test mode). Safe to call twice: the status guard and the
 * order-based idempotency key make a repeated confirmation a no-op.
 */
export async function completeCreditOrder(orderId: string, providerReference: string): Promise<"paid" | "already-paid" | "not-pending"> {
  try {
    const result = await bookCreditOrder(orderId, providerReference);

    if (result.outcome === "paid" && result.order.mode === "LIVE") {
      notifyAdmins("ORDER_PAID", {
        lines: [`@${result.order.username}: ${result.order.credits.toLocaleString("de-CH")} Credits, CHF ${(result.order.priceRappen / 100).toFixed(2)}`],
        path: "/admin/orders",
      });
    }

    return result.outcome;
  } catch (error) {
    // A paid order that cannot be booked means money without credits: the admins must look at it.
    if (getPaymentMode() === "LIVE") {
      notifyAdmins("PAYMENT_PROBLEM", {
        lines: [`Bestellung ${orderId} konnte nicht verbucht werden`, error instanceof Error ? error.message : "Unbekannter Fehler"],
        path: "/admin/orders",
      });
    }

    throw error;
  }
}

type BookedOrder = {
  username: string;
  credits: number;
  priceRappen: number;
  mode: "TEST" | "LIVE";
};

async function bookCreditOrder(
  orderId: string,
  providerReference: string,
): Promise<{ outcome: "paid"; order: BookedOrder } | { outcome: "already-paid" | "not-pending" }> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.creditOrder.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        userId: true,
        credits: true,
        packageId: true,
        priceRappen: true,
        mode: true,
        status: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!order) {
      return { outcome: "not-pending" as const };
    }

    if (order.status === "PAID") {
      return { outcome: "already-paid" as const };
    }

    const updated = await tx.creditOrder.updateMany({
      where: {
        id: order.id,
        status: "PENDING",
      },
      data: {
        status: "PAID",
        paidAt: new Date(),
        providerReference,
      },
    });

    if (updated.count === 0) {
      return { outcome: "not-pending" as const };
    }

    const transaction = await createWalletTransactionInTx(tx, {
      userId: order.userId,
      type: WalletTransactionType.CREDIT_PURCHASE,
      balanceType: WalletBalanceType.USER_CREDITS,
      amount: order.credits,
      idempotencyKey: `credit-order:${order.id}`,
      description: `${order.credits} Credits${order.mode === "TEST" ? " (Testzahlung)" : ""}`,
      referenceId: order.id,
      metadata: {
        packageId: order.packageId,
        mode: order.mode,
      },
    });

    await tx.creditOrder.update({
      where: {
        id: order.id,
      },
      data: {
        transactionId: transaction.id,
      },
    });

    return {
      outcome: "paid" as const,
      order: {
        username: order.user.username,
        credits: order.credits,
        priceRappen: order.priceRappen,
        mode: order.mode,
      },
    };
  });
}

/** Ends a pending order without booking credits (declined, cancelled by the buyer, or expired). */
export async function closeCreditOrder(orderId: string, status: Exclude<CreditOrderStatus, "PENDING" | "PAID">): Promise<boolean> {
  const updated = await prisma.creditOrder.updateMany({
    where: {
      id: orderId,
      status: "PENDING",
    },
    data: {
      status,
    },
  });

  return updated.count === 1;
}

/** Checkout URL of the provider; the simulated test checkout lives inside the app. */
export function getCheckoutUrl(provider: PaymentProvider, orderId: string): string {
  switch (provider) {
    case "TEST":
      return `/dashboard/checkout/test/${orderId}`;
  }
}
