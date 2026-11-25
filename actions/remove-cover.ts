"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import { getCreatorAccess } from "@/lib/access";
import { getBlobToken } from "@/lib/blob";
import { prisma } from "@/lib/prisma";

export type RemoveCoverResult = {
  success: boolean;
  message?: string;
};

export async function removeCoverAction(): Promise<RemoveCoverResult> {
  const access = await getCreatorAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: access.userId,
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
        userId: access.userId,
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
