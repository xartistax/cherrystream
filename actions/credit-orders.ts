"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCreatorAccess } from "@/lib/access";
import { getAvailableProviders, getPaymentMode } from "@/lib/payments/config";
import { closeCreditOrder, completeCreditOrder, createCreditOrder, getCheckoutUrl, PaymentUnavailableError } from "@/lib/payments/orders";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

export type CreditOrderActionResult = {
  success: boolean;
  message?: string;
};

const orderSchema = z.object({
  packageId: z.string().min(1),
  provider: z.enum(["TEST"]),
});

/** Creates a pending order and sends the model to the provider's checkout. */
export async function createCreditOrderAction(_previousState: CreditOrderActionResult, formData: FormData): Promise<CreditOrderActionResult> {
  const access = await getCreatorAccess({ requireActive: true });

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  const parsed = orderSchema.safeParse({
    packageId: formData.get("packageId"),
    provider: formData.get("provider") ?? getAvailableProviders()[0],
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Dieses Paket gibt es nicht.",
    };
  }

  const limit = await consumeRateLimit(`credit-order:${access.userId}`, 10, 60 * 60);

  if (!limit.allowed) {
    return {
      success: false,
      message: "Zu viele Bestellungen in kurzer Zeit. Bitte versuche es später erneut.",
    };
  }

  let checkoutUrl: string;

  try {
    const order = await createCreditOrder(access.userId, parsed.data.packageId, parsed.data.provider);
    checkoutUrl = getCheckoutUrl(parsed.data.provider, order.id);
  } catch (error) {
    if (error instanceof PaymentUnavailableError) {
      return {
        success: false,
        message: "Der Kauf von Credits ist gerade nicht möglich.",
      };
    }

    throw error;
  }

  redirect(checkoutUrl);
}

const testCheckoutSchema = z.object({
  orderId: z.string().min(1),
  outcome: z.enum(["pay", "decline", "cancel"]),
});

/**
 * The simulated provider of test mode: confirms or declines an order the way a real webhook would.
 * Refused outside test mode and for orders of other users or other providers.
 */
export async function resolveTestCheckoutAction(formData: FormData): Promise<void> {
  const access = await getCreatorAccess();

  if (!access.allowed || getPaymentMode() !== "TEST") {
    redirect("/dashboard/visibility");
  }

  const parsed = testCheckoutSchema.safeParse({
    orderId: formData.get("orderId"),
    outcome: formData.get("outcome"),
  });

  if (!parsed.success) {
    redirect("/dashboard/visibility");
  }

  const order = await prisma.creditOrder.findFirst({
    where: {
      id: parsed.data.orderId,
      userId: access.userId,
      provider: "TEST",
      mode: "TEST",
    },
    select: {
      id: true,
    },
  });

  if (order) {
    if (parsed.data.outcome === "pay") {
      await completeCreditOrder(order.id, `test-${Date.now()}`);
    } else {
      await closeCreditOrder(order.id, parsed.data.outcome === "decline" ? "FAILED" : "CANCELLED");
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/visibility");
  }

  redirect(`/dashboard/visibility?order=${parsed.data.orderId}`);
}
