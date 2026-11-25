"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { purgeVerificationDocuments } from "@/lib/verification/purge-documents";

const schema = z.object({
  password: z.string().min(1, "Passwort erforderlich."),
});

export type DeleteAccountState = {
  success: boolean;
  error?: string;
};

export async function deleteAccount(_: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  const session = await auth();

  if (session?.user?.impersonatedBy) {
    return {
      success: false,
      error: "Diese Aktion ist in der Admin-Ansicht gesperrt. Beende zuerst die Model-Ansicht.",
    };
  }

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

  try {
    await purgeVerificationDocuments({
      userId: session.user.id,
    });
  } catch (error) {
    // Account deletion must not fail because of storage; documentsDeletedAt stays null, so a later cleanup still finds them.
    console.error("Verification document purge failed:", error);
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
