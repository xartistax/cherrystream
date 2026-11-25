"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/lib/auth";
import { getHomePath } from "@/lib/impersonation";
import { prisma } from "@/lib/prisma";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { loginSchema } from "@/lib/validations/auth";
import type { ActionState } from "@/types/action-state";

export async function loginAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsedData = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsedData.success) {
    return {
      success: false,
      errors: parsedData.error.flatten().fieldErrors,
    };
  }

  // The role only decides the landing page; signIn below still verifies the password.
  const account = await prisma.user.findUnique({
    where: {
      email: parsedData.data.email.trim().toLowerCase(),
    },
    select: {
      role: true,
    },
  });

  try {
    await signIn("credentials", {
      email: parsedData.data.email,
      password: parsedData.data.password,
      redirectTo: getSafeRedirectPath(formData.get("callbackUrl"), getHomePath(account?.role ?? "USER")),
    });

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        message: "E-Mail oder Passwort ist ungültig.",
      };
    }

    throw error;
  }
}
