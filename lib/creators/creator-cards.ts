import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { CreatorCardData } from "@/components/public/creator-card";
import { prisma } from "@/lib/prisma";

/** Fields a creator card needs; shared by explore and favorites so both show identical cards. */
export const creatorCardSelect = {
  id: true,
  username: true,
  name: true,
  image: true,
  createdAt: true,

  profile: {
    select: {
      displayName: true,
      verified: true,
      city: {
        select: {
          name: true,
        },
      },
      canton: {
        select: {
          name: true,
          slug: true,
        },
      },
      categories: {
        select: {
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          category: {
            sortOrder: "asc",
          },
        },
        take: 3,
      },
    },
  },

  posts: {
    where: {
      status: "PUBLISHED",
      visibility: "PUBLIC",
      media: {
        some: {
          status: "READY",
        },
      },
    },
    select: {
      media: {
        where: {
          status: "READY",
        },
        select: {
          type: true,
          url: true,
          feedUrl: true,
          posterUrl: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
  },

  _count: {
    select: {
      posts: {
        where: {
          status: "PUBLISHED",
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

type CreatorCardRow = Prisma.UserGetPayload<{ select: typeof creatorCardSelect }>;

/** Adds photo and video counts and maps the rows to card data. */
export async function toCreatorCards(creators: CreatorCardRow[]): Promise<CreatorCardData[]> {
  const creatorIds = creators.map((creator) => creator.id);

  const media =
    creatorIds.length > 0
      ? await prisma.postMedia.findMany({
          where: {
            status: "READY",
            post: {
              authorId: {
                in: creatorIds,
              },
              status: "PUBLISHED",
              visibility: "PUBLIC",
            },
          },
          select: {
            type: true,
            post: {
              select: {
                authorId: true,
              },
            },
          },
        })
      : [];

  const counts = new Map(creatorIds.map((id) => [id, { images: 0, videos: 0 }]));

  for (const item of media) {
    const count = counts.get(item.post.authorId);

    if (count) {
      count[item.type === "VIDEO" ? "videos" : "images"] += 1;
    }
  }

  return creators.map((creator) => ({
    username: creator.username,
    name: creator.name,
    image: creator.image,
    profile: creator.profile
      ? {
          displayName: creator.profile.displayName,
          verified: creator.profile.verified,
          city: creator.profile.city?.name ?? null,
          canton: creator.profile.canton?.name ?? null,
          categories: creator.profile.categories,
        }
      : null,
    posts: creator.posts,
    _count: creator._count,
    mediaCounts: counts.get(creator.id) ?? { images: 0, videos: 0 },
  }));
}
