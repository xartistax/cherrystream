"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/lib/auth";
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

  try {
    await signIn("credentials", {
      email: parsedData.data.email,
      password: parsedData.data.password,
      redirectTo: getSafeRedirectPath(formData.get("callbackUrl"), "/explore"),
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
