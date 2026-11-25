import "server-only";

import { prisma } from "@/lib/prisma";

/** A gallery image can be the profile picture while it is ready and its upload is published (not hidden or deleted). */
const usableImageWhere = (userId: string) => ({
  type: "IMAGE" as const,
  status: "READY" as const,
  post: {
    authorId: userId,
    status: "PUBLISHED" as const,
  },
});

/**
 * Profile picture = the image the model chose, otherwise the first image she uploaded.
 * Keeps User.image (used everywhere for avatars) in sync; call it after every upload, deletion, choice or moderation change.
 */
export async function syncProfileImage(userId: string): Promise<void> {
  const profile = await prisma.profile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      avatarMediaId: true,
    },
  });

  const chosen = profile?.avatarMediaId
    ? await prisma.postMedia.findFirst({
        where: {
          id: profile.avatarMediaId,
          ...usableImageWhere(userId),
        },
        select: {
          id: true,
          profileUrl: true,
          feedUrl: true,
          url: true,
        },
      })
    : null;

  const image =
    chosen ??
    (await prisma.postMedia.findFirst({
      where: usableImageWhere(userId),
      orderBy: [{ createdAt: "asc" }, { sortOrder: "asc" }],
      select: {
        id: true,
        profileUrl: true,
        feedUrl: true,
        url: true,
      },
    }));

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      image: image ? (image.profileUrl ?? image.feedUrl ?? image.url) : null,
    },
  });

  // A chosen picture that is no longer usable (hidden by an admin, for example) is forgotten.
  if (profile?.avatarMediaId && !chosen) {
    await prisma.profile.update({
      where: {
        id: profile.id,
      },
      data: {
        avatarMediaId: null,
      },
    });
  }
}

/** The media id currently shown as profile picture, for marking it in the gallery. */
export async function getProfileImageMediaId(userId: string): Promise<string | null> {
  const profile = await prisma.profile.findUnique({
    where: {
      userId,
    },
    select: {
      avatarMediaId: true,
    },
  });

  if (profile?.avatarMediaId) {
    const chosen = await prisma.postMedia.findFirst({
      where: {
        id: profile.avatarMediaId,
        ...usableImageWhere(userId),
      },
      select: {
        id: true,
      },
    });

    if (chosen) {
      return chosen.id;
    }
  }

  const first = await prisma.postMedia.findFirst({
    where: usableImageWhere(userId),
    orderBy: [{ createdAt: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
    },
  });

  return first?.id ?? null;
}
