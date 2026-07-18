import "server-only";

import { prisma } from "@/lib/prisma";

type GetPostAccessInput = {
  postId: string;
  ownerId: string;
  viewerId?: string | null;
  visibility: "PUBLIC" | "FOLLOWERS" | "PREMIUM";
};

export async function getPostAccess({ postId, ownerId, viewerId, visibility }: GetPostAccessInput): Promise<boolean> {
  if (visibility !== "PREMIUM") {
    return true;
  }

  if (viewerId === ownerId) {
    return true;
  }

  if (!viewerId) {
    return false;
  }

  const unlock = await prisma.postUnlock.findUnique({
    where: {
      userId_postId: {
        userId: viewerId,
        postId,
      },
    },
    select: {
      id: true,
    },
  });

  return unlock !== null;
}
