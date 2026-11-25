"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCreatorAccess } from "@/lib/access";
import { getBlobToken } from "@/lib/blob";
import { paymentsEnabled } from "@/lib/features";
import { syncProfileImage } from "@/lib/gallery/profile-image";
import { preparePostMedia } from "@/lib/media/prepare-post-media";
import { prisma } from "@/lib/prisma";
import { galleryUploadSchema, type GalleryUploadInput } from "@/lib/validations/post";

export type GalleryActionResult = {
  success: boolean;
  message?: string;
};

function revalidateGallery(username?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/gallery");
  revalidatePath("/");
  revalidatePath("/explore");

  if (username) {
    revalidatePath(`/profile/${username}`);
  }
}

async function getUsername(userId: string): Promise<string | undefined> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      username: true,
    },
  });

  return user?.username;
}

/** Each uploaded file becomes its own gallery item (internally a Post with one PostMedia). */
export async function uploadGalleryAction(input: GalleryUploadInput): Promise<GalleryActionResult> {
  const access = await getCreatorAccess({ requireActive: true });

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  const parsed = galleryUploadSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Ungültiger Upload.",
    };
  }

  const premium = paymentsEnabled && parsed.data.premium;
  const userId = access.userId;

  try {
    const prepared = await preparePostMedia(parsed.data.media, userId);

    try {
      await prisma.$transaction(
        prepared.media.map((media) =>
          prisma.post.create({
            data: {
              authorId: userId,
              visibility: premium ? "PREMIUM" : "PUBLIC",
              unlockPrice: premium ? parsed.data.unlockPrice : null,
              media: {
                create: {
                  ...media,
                  sortOrder: 0,
                },
              },
            },
          }),
        ),
      );
    } catch (databaseError) {
      if (prepared.createdBlobUrls.length > 0) {
        await del(prepared.createdBlobUrls, {
          token: getBlobToken(),
        }).catch((cleanupError: unknown) => {
          console.error("Gallery upload rollback cleanup failed:", cleanupError);
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

    await syncProfileImage(userId);
    revalidateGallery(await getUsername(userId));

    return {
      success: true,
    };
  } catch (error) {
    console.error("Gallery upload failed:", error);

    return {
      success: false,
      message: error instanceof Error ? error.message : "Der Upload konnte nicht gespeichert werden.",
    };
  }
}

const mediaIdSchema = z.string().min(1);

/** Deletes one image or video including its blobs. An upload that contained several files keeps the others. */
export async function deleteGalleryItemAction(mediaId: string): Promise<GalleryActionResult> {
  const access = await getCreatorAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  const media = await prisma.postMedia.findFirst({
    where: {
      id: mediaIdSchema.parse(mediaId),
      post: {
        authorId: access.userId,
      },
    },
    select: {
      id: true,
      postId: true,
      url: true,
      originalUrl: true,
      profileUrl: true,
      feedUrl: true,
      fullUrl: true,
      posterUrl: true,
      post: {
        select: {
          _count: {
            select: {
              media: true,
            },
          },
        },
      },
    },
  });

  if (!media) {
    return {
      success: false,
      message: "Das Element wurde nicht gefunden.",
    };
  }

  const blobUrls = Array.from(
    new Set([media.url, media.originalUrl, media.profileUrl, media.feedUrl, media.fullUrl, media.posterUrl].filter((url): url is string => Boolean(url))),
  );

  if (media.post._count.media <= 1) {
    await prisma.post.delete({
      where: {
        id: media.postId,
      },
    });
  } else {
    await prisma.postMedia.delete({
      where: {
        id: media.id,
      },
    });
  }

  if (blobUrls.length > 0) {
    await del(blobUrls, {
      token: getBlobToken(),
    }).catch((error: unknown) => {
      console.error("Gallery blob cleanup failed:", error);
    });
  }

  await syncProfileImage(access.userId);
  revalidateGallery(await getUsername(access.userId));

  return {
    success: true,
  };
}

/** Marks an image (never a video) as profile picture. */
export async function setProfileImageAction(mediaId: string): Promise<GalleryActionResult> {
  const access = await getCreatorAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  const media = await prisma.postMedia.findFirst({
    where: {
      id: mediaIdSchema.parse(mediaId),
      type: "IMAGE",
      status: "READY",
      post: {
        authorId: access.userId,
        status: "PUBLISHED",
      },
    },
    select: {
      id: true,
    },
  });

  if (!media) {
    return {
      success: false,
      message: "Nur eigene, sichtbare Bilder können Profilbild sein.",
    };
  }

  await prisma.profile.update({
    where: {
      userId: access.userId,
    },
    data: {
      avatarMediaId: media.id,
    },
  });

  await syncProfileImage(access.userId);
  revalidateGallery(await getUsername(access.userId));

  return {
    success: true,
  };
}
