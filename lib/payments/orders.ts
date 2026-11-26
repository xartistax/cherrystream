import "server-only";

import { WalletBalanceType, WalletTransactionType, type CreditOrderStatus, type PaymentProvider } from "@/generated/prisma/client";
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
        mode: true,
        status: true,
      },
    });

    if (!order) {
      return "not-pending";
    }

    if (order.status === "PAID") {
      return "already-paid";
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
      return "not-pending";
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

    return "paid";
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
