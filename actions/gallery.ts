"use server";

import { del } from "@vercel/blob";
import { z } from "zod";

import { getCreatorAccess } from "@/lib/access";
import { getBlobToken } from "@/lib/blob";
import { syncProfileImage } from "@/lib/gallery/profile-image";
import { revalidateGallery } from "@/lib/gallery/revalidate-gallery";
import { prisma } from "@/lib/prisma";

export type GalleryActionResult = {
  success: boolean;
  message?: string;
};

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
  await revalidateGallery(access.userId);

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
  await revalidateGallery(access.userId);

  return {
    success: true,
  };
}
