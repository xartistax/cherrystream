"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { getBlobToken } from "@/lib/blob";
import { prisma } from "@/lib/prisma";

export type DeletePostResult = {
  success: boolean;
  message?: string;
};

export async function deletePostAction(postId: string): Promise<DeletePostResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Du bist nicht angemeldet.",
    };
  }

  try {
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        authorId: session.user.id,
      },
      select: {
        id: true,
        media: {
          select: {
            url: true,
            originalUrl: true,
            profileUrl: true,
            feedUrl: true,
            fullUrl: true,
            posterUrl: true,
          },
        },
      },
    });

    if (!post) {
      return {
        success: false,
        message: "Der Inhalt wurde nicht gefunden.",
      };
    }

    const blobUrls = Array.from(
      new Set(
        post.media.flatMap((media) =>
          [media.url, media.originalUrl, media.profileUrl, media.feedUrl, media.fullUrl, media.posterUrl].filter(
            (url): url is string => typeof url === "string" && url.length > 0,
          ),
        ),
      ),
    );

    await prisma.post.delete({
      where: {
        id: post.id,
      },
    });

    if (blobUrls.length > 0) {
      await del(blobUrls, {
        token: getBlobToken(),
      }).catch((error: unknown) => {
        console.error("Post blob cleanup failed:", error);
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/posts");
    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete post failed:", error);

    return {
      success: false,
      message: "Der Inhalt konnte nicht gelöscht werden.",
    };
  }
}
