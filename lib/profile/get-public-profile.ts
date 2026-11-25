import "server-only";

import { auth } from "@/lib/auth";
import { paymentsEnabled } from "@/lib/features";
import { prisma } from "@/lib/prisma";

export async function getPublicProfile(username: string) {
  const session = await auth();
  const viewerId = session?.user?.id;

  return prisma.user.findFirst({
    where: {
      username: username.toLowerCase(),
      status: "ACTIVE",
      profile: {
        is: {
          isPublic: true,
        },
      },
    },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      createdAt: true,

      profile: {
        select: {
          displayName: true,
          bio: true,
          coverUrl: true,
          website: true,
          instagram: true,
          verified: true,

          city: {
            select: {
              name: true,
              slug: true,
            },
          },

          canton: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },

      followers: viewerId
        ? {
            where: {
              followerId: viewerId,
            },
            select: {
              followerId: true,
            },
            take: 1,
          }
        : false,

      posts: {
        where: {
          status: "PUBLISHED",
          ...(paymentsEnabled ? {} : { visibility: { not: "PREMIUM" } }),
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          content: true,
          visibility: true,
          unlockPrice: true,
          createdAt: true,

          media: {
            where: {
              status: "READY",
            },
            orderBy: {
              sortOrder: "asc",
            },
            select: {
              id: true,
              type: true,
              url: true,
              feedUrl: true,
              fullUrl: true,
              blurHash: true,
              width: true,
              height: true,
            },
          },

          _count: {
            select: {
              likes: true,
            },
          },

          likes: viewerId
            ? {
                where: {
                  userId: viewerId,
                },
                select: {
                  userId: true,
                },
                take: 1,
              }
            : false,

          unlocks: viewerId
            ? {
                where: {
                  userId: viewerId,
                },
                select: {
                  userId: true,
                },
                take: 1,
              }
            : false,
        },
      },

      _count: {
        select: {
          posts: {
            where: {
              status: "PUBLISHED",
            },
          },
          followers: true,
          following: true,
          postLikes: true,
        },
      },
    },
  });
}

export type PublicProfile = NonNullable<Awaited<ReturnType<typeof getPublicProfile>>>;
