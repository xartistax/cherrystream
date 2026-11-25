"use server";

// Kept apart from the other gallery actions: uploading pulls in FFmpeg (~230 MB), which should only be
// traced into /dashboard/gallery and not into every page that can delete an item or pick a profile image.
import { del } from "@vercel/blob";

import type { GalleryActionResult } from "@/actions/gallery";
import { getCreatorAccess } from "@/lib/access";
import { getBlobToken } from "@/lib/blob";
import { paymentsEnabled } from "@/lib/features";
import { syncProfileImage } from "@/lib/gallery/profile-image";
import { revalidateGallery } from "@/lib/gallery/revalidate-gallery";
import { preparePostMedia } from "@/lib/media/prepare-post-media";
import { prisma } from "@/lib/prisma";
import { galleryUploadSchema, type GalleryUploadInput } from "@/lib/validations/post";

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
    await revalidateGallery(userId);

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
