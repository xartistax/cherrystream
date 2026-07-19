"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AccountActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialAccountActionState: AccountActionState = {
  status: "idle",
  message: "",
};

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ungültige E-Mail-Adresse."),
  currentPassword: z.string().min(1, "Aktuelles Passwort fehlt."),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Aktuelles Passwort fehlt."),
    newPassword: z.string().min(8, "Das neue Passwort muss mindestens 8 Zeichen enthalten.").max(72, "Das neue Passwort darf maximal 72 Zeichen enthalten."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Die Passwörter stimmen nicht überein.",
  });

export async function updateEmail(_previousState: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "Deine Sitzung ist abgelaufen.",
    };
  }

  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
    currentPassword: formData.get("currentPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Ungültige Eingabe.",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        email: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      return {
        status: "error",
        message: "Für dieses Konto kann die E-Mail hier nicht geändert werden.",
      };
    }

    const passwordMatches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);

    if (!passwordMatches) {
      return {
        status: "error",
        message: "Das aktuelle Passwort ist falsch.",
      };
    }

    if (user.email === parsed.data.email) {
      return {
        status: "error",
        message: "Diese E-Mail-Adresse wird bereits verwendet.",
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: parsed.data.email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return {
        status: "error",
        message: "Diese E-Mail-Adresse wird bereits verwendet.",
      };
    }

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        email: parsed.data.email,
        emailVerified: null,
      },
    });

    revalidatePath("/settings/account");

    return {
      status: "success",
      message: "E-Mail-Adresse wurde aktualisiert.",
    };
  } catch {
    return {
      status: "error",
      message: "Die E-Mail-Adresse konnte nicht aktualisiert werden.",
    };
  }
}

export async function updatePassword(_previousState: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      status: "error",
      message: "Deine Sitzung ist abgelaufen.",
    };
  }

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Ungültige Eingabe.",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      return {
        status: "error",
        message: "Für dieses Konto kann das Passwort hier nicht geändert werden.",
      };
    }

    const passwordMatches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);

    if (!passwordMatches) {
      return {
        status: "error",
        message: "Das aktuelle Passwort ist falsch.",
      };
    }

    const usesSamePassword = await bcrypt.compare(parsed.data.newPassword, user.passwordHash);

    if (usesSamePassword) {
      return {
        status: "error",
        message: "Das neue Passwort muss sich vom aktuellen unterscheiden.",
      };
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        passwordHash,
      },
    });

    return {
      status: "success",
      message: "Passwort wurde aktualisiert.",
    };
  } catch {
    return {
      status: "error",
      message: "Das Passwort konnte nicht aktualisiert werden.",
    };
  }
}
