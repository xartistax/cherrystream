"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { consumeEmailToken } from "@/lib/email/tokens";
import { sendVerificationEmail } from "@/lib/email/verification";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, formatRetryAfter } from "@/lib/rate-limit";

export type ResendVerificationState = {
  success: boolean;
  message?: string;
};

/** Confirmation happens on a button click, not on GET, so mail link scanners cannot use up the token. */
export async function confirmEmailAction(formData: FormData): Promise<void> {
  const token = formData.get("token");
  const email = typeof token === "string" ? await consumeEmailToken("verify-email", token) : null;

  if (!email) {
    redirect("/verify-email/invalid");
  }

  await prisma.user.updateMany({
    where: {
      email,
      emailVerified: null,
    },
    data: {
      emailVerified: new Date(),
    },
  });

  revalidatePath("/", "layout");

  const session = await auth();

  redirect(session?.user ? "/settings?emailVerified=1" : "/login?verified=1");
}

export async function resendVerificationEmailAction(): Promise<ResendVerificationState> {
  const session = await auth();

  if (!session?.user?.id || session.user.impersonatedBy) {
    return {
      success: false,
      message: "Nicht möglich.",
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      email: true,
      emailVerified: true,
    },
  });

  if (!user || user.emailVerified) {
    return {
      success: true,
      message: "Deine E-Mail-Adresse ist bereits bestätigt.",
    };
  }

  const limit = await consumeRateLimit(`verify-email:${session.user.id}`, 3, 60 * 60);

  if (!limit.allowed) {
    return {
      success: false,
      message: `Bitte warte etwas. Du kannst ${formatRetryAfter(limit.retryAfterSeconds)} eine neue E-Mail anfordern.`,
    };
  }

  await sendVerificationEmail(user.email);

  return {
    success: true,
    message: `Wir haben eine neue E-Mail an ${user.email} geschickt.`,
  };
}
