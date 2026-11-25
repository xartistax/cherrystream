import "server-only";

import type { GalleryItem } from "@/components/gallery/gallery-manager";
import { getProfileImageMediaId } from "@/lib/gallery/profile-image";
import { prisma } from "@/lib/prisma";

/** All ready images and videos of a model, newest first, for the dashboard gallery. */
export async function getGalleryItems(userId: string, take?: number): Promise<GalleryItem[]> {
  const [media, profileImageId] = await Promise.all([
    prisma.postMedia.findMany({
      where: {
        status: "READY",
        post: {
          authorId: userId,
          status: {
            not: "DELETED",
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { sortOrder: "asc" }],
      take,
      select: {
        id: true,
        type: true,
        url: true,
        feedUrl: true,
        posterUrl: true,
        post: {
          select: {
            status: true,
            visibility: true,
          },
        },
      },
    }),
    getProfileImageMediaId(userId),
  ]);

  return media.map((item) => ({
    id: item.id,
    type: item.type,
    previewUrl: item.type === "VIDEO" ? (item.posterUrl ?? null) : (item.feedUrl ?? item.url),
    isProfileImage: item.id === profileImageId,
    hidden: item.post.status === "HIDDEN",
    premium: item.post.visibility === "PREMIUM",
  }));
}
