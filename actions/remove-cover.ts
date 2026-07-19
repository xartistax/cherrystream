"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { getBlobToken } from "@/lib/blob";
import { prisma } from "@/lib/prisma";

export type RemoveCoverResult = {
  success: boolean;
  message?: string;
};

export async function removeCoverAction(): Promise<RemoveCoverResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Du bist nicht angemeldet.",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        username: true,
        profile: {
          select: {
            coverUrl: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        message: "Benutzerkonto nicht gefunden.",
      };
    }

    await prisma.profile.update({
      where: {
        userId: session.user.id,
      },
      data: {
        coverUrl: null,
        coverPathname: null,
      },
    });

    if (user.profile?.coverUrl) {
      await del(user.profile.coverUrl, {
        token: getBlobToken(),
      }).catch((error: unknown) => {
        console.error("Cover deletion failed:", error);
      });
    }

    revalidatePath("/profile");
    revalidatePath("/profile/edit");
    revalidatePath(`/profile/${user.username}`);
    revalidatePath("/");
    revalidatePath("/explore");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Remove cover failed:", error);

    return {
      success: false,
      message: "Das Cover konnte nicht entfernt werden.",
    };
  }
}
