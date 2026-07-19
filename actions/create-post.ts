"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import { getBlobToken } from "@/lib/blob";
import { auth } from "@/lib/auth";
import { preparePostMedia } from "@/lib/media/prepare-post-media";
import { prisma } from "@/lib/prisma";
import { createPostSchema, type CreatePostInput } from "@/lib/validations/post";

export type CreatePostResult = {
  success: boolean;
  message?: string;
};

export async function createPostAction(input: CreatePostInput): Promise<CreatePostResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Du bist nicht angemeldet.",
    };
  }

  const parsedInput = createPostSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      message: parsedInput.error.issues[0]?.message ?? "Ungültige Eingabe.",
    };
  }

  const userId = session.user.id;

  try {
    const prepared = await preparePostMedia(parsedInput.data.media, userId);

    try {
      await prisma.post.create({
        data: {
          authorId: userId,
          content: parsedInput.data.content || null,
          visibility: parsedInput.data.visibility,
          unlockPrice: parsedInput.data.unlockPrice,

          media: {
            create: prepared.media.map((media, index) => ({
              type: media.type,
              status: media.status,

              url: media.url,
              pathname: media.pathname,
              mimeType: media.mimeType,
              size: media.size,
              sortOrder: index,

              originalUrl: media.originalUrl,
              originalPathname: media.originalPathname,

              profileUrl: media.profileUrl,
              profilePathname: media.profilePathname,

              feedUrl: media.feedUrl,
              feedPathname: media.feedPathname,

              fullUrl: media.fullUrl,
              fullPathname: media.fullPathname,

              posterUrl: media.posterUrl,
              posterPathname: media.posterPathname,
              duration: media.duration,

              blurHash: media.blurHash,
              checksum: media.checksum,

              width: media.width,
              height: media.height,
            })),
          },
        },
      });
    } catch (databaseError) {
      if (prepared.createdBlobUrls.length > 0) {
        await del(prepared.createdBlobUrls, {
          token: getBlobToken(),
        }).catch((cleanupError: unknown) => {
          console.error("Database rollback blob cleanup failed:", cleanupError);
        });
      }

      throw databaseError;
    }

    if (prepared.rawImageUrls.length > 0) {
      await del(prepared.rawImageUrls, {
        token: getBlobToken(),
      }).catch((cleanupError: unknown) => {
        console.error("Raw image cleanup failed:", cleanupError);
      });
    }

    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Create post failed:", error);

    return {
      success: false,
      message: error instanceof Error ? error.message : "Der Beitrag konnte nicht erstellt werden.",
    };
  }
}
