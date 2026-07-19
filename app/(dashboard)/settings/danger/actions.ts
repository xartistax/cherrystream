"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  password: z.string().min(1, "Passwort erforderlich."),
});

export type DeleteAccountState = {
  success: boolean;
  error?: string;
};

export async function deleteAccount(_: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Nicht angemeldet.",
    };
  }

  const parsed = schema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message,
    };
  }

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
      success: false,
      error: "Ungültiges Konto.",
    };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!valid) {
    return {
      success: false,
      error: "Falsches Passwort.",
    };
  }

  await prisma.$transaction([
    prisma.profile.updateMany({
      where: {
        userId: session.user.id,
      },
      data: {
        isPublic: false,
      },
    }),

    prisma.session.deleteMany({
      where: {
        userId: session.user.id,
      },
    }),

    prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        status: "DELETED",
      },
    }),
  ]);

  revalidatePath("/");

  await signOut({
    redirect: false,
  });

  redirect("/login?deleted=1");
}
