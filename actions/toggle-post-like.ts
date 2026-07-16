"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type TogglePostLikeResult = {
  success: boolean;
  liked?: boolean;
  message?: string;
};

export async function togglePostLikeAction(postId: string, username: string): Promise<TogglePostLikeResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Bitte melde dich zuerst an.",
    };
  }

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      status: "PUBLISHED",
    },
    select: {
      id: true,
    },
  });

  if (!post) {
    return {
      success: false,
      message: "Beitrag nicht gefunden.",
    };
  }

  const where = {
    userId_postId: {
      userId: session.user.id,
      postId,
    },
  };

  try {
    const existingLike = await prisma.postLike.findUnique({
      where,
      select: {
        postId: true,
      },
    });

    if (existingLike) {
      await prisma.postLike.delete({
        where,
      });

      revalidatePath(`/profile/${username}`);

      return {
        success: true,
        liked: false,
      };
    }

    await prisma.postLike.create({
      data: {
        userId: session.user.id,
        postId,
      },
    });

    revalidatePath(`/profile/${username}`);

    return {
      success: true,
      liked: true,
    };
  } catch (error) {
    console.error("Toggle post like failed:", error);

    return {
      success: false,
      message: "Like konnte nicht aktualisiert werden.",
    };
  }
}
