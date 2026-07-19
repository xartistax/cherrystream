"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import type { ActionState } from "@/types/action-state";

export async function registerAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const parsedData = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
    birthDate: formData.get("birthDate"),
    termsAccepted: formData.get("termsAccepted"),
  });

  if (!parsedData.success) {
    console.error(
      "Registration validation failed:",

      parsedData.error.flatten(),
    );
    return {
      success: false,
      errors: parsedData.error.flatten().fieldErrors,
    };
  }

  const { displayName, username, email, password, birthDate } = parsedData.data;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
      select: {
        email: true,
        username: true,
      },
    });

    if (existingUser?.email === email) {
      return {
        success: false,
        errors: {
          email: ["Für diese E-Mail existiert bereits ein Konto."],
        },
      };
    }

    if (existingUser?.username === username) {
      return {
        success: false,
        errors: {
          username: ["Dieser Benutzername ist bereits vergeben."],
        },
      };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        username,
        name: displayName,
        passwordHash,
        wallet: {
          create: {},
        },
        profile: {
          create: {
            displayName,
            birthDate: new Date(`${birthDate}T00:00:00.000Z`),
          },
        },
      },
    });
  } catch (error) {
    console.error("Registration failed:", error);

    return {
      success: false,
      message: "Die Registrierung ist fehlgeschlagen.",
    };
  }

  redirect("/login?registered=1");
}
