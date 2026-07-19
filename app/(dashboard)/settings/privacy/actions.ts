"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updateProfileVisibility(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Nicht autorisiert.");
  }

  if (session.user.role !== "MODEL" && session.user.role !== "ADMIN") {
    throw new Error("Kein öffentliches Profil vorhanden.");
  }

  const isPublic = formData.get("visibility") === "public";

  try {
    await prisma.profile.update({
      where: {
        userId: session.user.id,
      },
      data: {
        isPublic,
      },
    });

    revalidatePath("/settings/privacy");
    revalidatePath(`/profile/${session.user.username}`);
    revalidatePath("/explore");
  } catch {
    throw new Error("Die Sichtbarkeit konnte nicht aktualisiert werden.");
  }
}
