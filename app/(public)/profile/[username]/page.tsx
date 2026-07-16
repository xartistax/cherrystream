import { notFound } from "next/navigation";
import Image from "next/image";

import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ProfileGallery } from "@/components/profile/gallery/profile-gallery";

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;

  return {
    title: `${username} • CherryStream`,
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: {
      username,
    },

    select: {
      username: true,
      image: true,
      createdAt: true,

      profile: {
        select: {
          displayName: true,
          bio: true,
          isPublic: true,
          coverUrl: true,
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

          categories: {
            orderBy: {
              category: {
                sortOrder: "asc",
              },
            },
            select: {
              category: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      },

      posts: {
        where: {
          status: "PUBLISHED",
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          visibility: true,
          unlockPrice: true,
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
              posterUrl: true,
            },
          },
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
          postLikes: true,
        },
      },
    },
  });

  if (!user || !user.profile?.isPublic) {
    notFound();
  }

  const displayName = user.profile.displayName ?? user.username;
  const location = [user.profile.city?.name, user.profile.canton?.name]

    .filter(Boolean)

    .join(", ");

  const galleryMedia = user.posts.flatMap((post) =>
    post.media.map((media) => ({
      id: media.id,
      postId: post.id,
      type: media.type,
      url: media.url,
      feedUrl: media.feedUrl,
      fullUrl: media.fullUrl,
      posterUrl: media.posterUrl,
      visibility: post.visibility,
      unlockPrice: post.unlockPrice,
    })),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/80 shadow-2xl shadow-black/20">
        <div className="relative h-56 overflow-hidden bg-linear-to-br from-rose-600 via-pink-600 to-fuchsia-700 sm:h-72">
          {user.profile.coverUrl ? (
            <Image
              src={user.profile.coverUrl}
              alt={`Cover von ${displayName}`}
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
          ) : null}

          <div className="absolute inset-0 bg-linear-to-t from-zinc-900 via-zinc-900/15 to-black/10" />
        </div>

        <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-16 flex flex-col gap-6 sm:-mt-20 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <Avatar className="size-32 border-4 border-zinc-900 bg-zinc-900 shadow-2xl sm:size-40">
                <AvatarImage src={user.image ?? undefined} alt={displayName} />

                <AvatarFallback className="bg-rose-500/15 text-2xl font-bold text-rose-300">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="pb-1">
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{displayName}</h1>

                <p className="mt-1 text-zinc-500">@{user.username}</p>

                {user.profile.categories.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {user.profile.categories.map(({ category }) => (
                      <Link key={category.slug} href={`/creators?category=${category.slug}`}>
                        <Badge
                          variant="secondary"
                          className="cursor-pointer rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-500/20"
                        >
                          {category.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:min-w-80">
              <div className="rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-center">
                <div className="text-2xl font-black text-white">{user._count.posts}</div>

                <div className="mt-1 text-xs text-zinc-500">Beiträge</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-center">
                <div className="text-2xl font-black text-white">—</div>

                <div className="mt-1 text-xs text-zinc-500">Follower</div>
              </div>

              <div className="rounded-2xl border border-white/10  bg-white/3 px-4 py-3 text-center">
                <div className="text-2xl font-black text-white">—</div>

                <div className="mt-1 text-xs text-zinc-500">Likes</div>
              </div>
            </div>
          </div>

          <div className="mt-6 max-w-2xl">
            {location && <p className="mt-5 text-zinc-400">{location}</p>}

            {user.profile.bio && <p className="mt-4 whitespace-pre-wrap leading-7 text-zinc-300">{user.profile.bio}</p>}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button className="bg-rose-600 text-white hover:bg-rose-500">Folgen</Button>

            <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
              Nachricht
            </Button>

            <Badge variant="secondary" className="border border-white/10 bg-white/5 text-zinc-300">
              Öffentliches Profil
            </Badge>
          </div>
        </div>
      </div>

      <ProfileGallery displayName={displayName} media={galleryMedia} />
    </div>
  );
}
