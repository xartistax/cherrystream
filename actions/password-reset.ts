"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

import { sendEmail } from "@/lib/email/send";
import { getAppUrl, passwordResetEmail } from "@/lib/email/templates";
import { consumeEmailToken, createEmailToken } from "@/lib/email/tokens";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, formatRetryAfter, getRequestIpHash, hashIdentifier } from "@/lib/rate-limit";
import type { ActionState } from "@/types/action-state";

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email("Bitte gib eine gültige E-Mail-Adresse ein."),
});

const resetSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Das Passwort muss mindestens 8 Zeichen haben.").max(72, "Das Passwort darf maximal 72 Zeichen haben."),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Die Passwörter stimmen nicht überein.",
  });

const REQUEST_CONFIRMATION = "Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link zum Zurücksetzen geschickt. Er ist 1 Stunde gültig.";

export async function requestPasswordResetAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = requestSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      success: false,
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { email } = parsed.data;

  const [byIp, byEmail] = await Promise.all([
    consumeRateLimit(`password-reset:ip:${await getRequestIpHash()}`, 10, 60 * 60),
    consumeRateLimit(`password-reset:email:${hashIdentifier(email)}`, 3, 60 * 60),
  ]);

  if (!byIp.allowed) {
    return {
      success: false,
      message: `Zu viele Anfragen. Bitte versuche es ${formatRetryAfter(byIp.retryAfterSeconds)} erneut.`,
    };
  }

  // Same answer whether or not the account exists, so the form does not reveal registered emails.
  if (!byEmail.allowed) {
    return {
      success: true,
      message: REQUEST_CONFIRMATION,
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      status: true,
      passwordHash: true,
    },
  });

  if (user?.status === "ACTIVE" && user.passwordHash) {
    const token = await createEmailToken("password-reset", email);

    await sendEmail({
      to: email,
      ...passwordResetEmail(getAppUrl(`/reset-password/${token}`)),
    });
  }

  return {
    success: true,
    message: REQUEST_CONFIRMATION,
  };
}

export async function resetPasswordAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });

  if (!parsed.success) {
    return {
      success: false,
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const email = await consumeEmailToken("password-reset", parsed.data.token);

  if (!email) {
    return {
      success: false,
      message: "Der Link ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen an.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  // Raising sessionVersion signs out every existing session, e.g. of someone who took over the account.
  const updated = await prisma.user.updateMany({
    where: {
      email,
      status: "ACTIVE",
    },
    data: {
      passwordHash,
      sessionVersion: {
        increment: 1,
      },
    },
  });

  if (updated.count === 0) {
    return {
      success: false,
      message: "Das Konto wurde nicht gefunden.",
    };
  }

  redirect("/login?reset=1");
}
