import "server-only";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

/** Refreshes every page that shows a model's gallery or profile image. */
export async function revalidateGallery(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      username: true,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/gallery");
  revalidatePath("/");
  revalidatePath("/explore");

  if (user?.username) {
    revalidatePath(`/profile/${user.username}`);
  }
}
