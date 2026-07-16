import { Cherry, Compass, Flame, Home, Shuffle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { BackButton } from "@/components/public/back-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

async function getTrendingCreators() {
  return prisma.user.findMany({
    where: {
      status: "ACTIVE",
      profile: {
        is: {
          isPublic: true,
        },
      },
    },
    select: {
      username: true,
      name: true,
      image: true,
      profile: {
        select: {
          displayName: true,
          city: true,
          country: true,
        },
      },
      posts: {
        where: {
          status: "PUBLISHED",
          visibility: "PUBLIC",
          media: {
            some: {
              type: "IMAGE",
              status: "READY",
            },
          },
        },
        select: {
          media: {
            where: {
              type: "IMAGE",
              status: "READY",
            },
            select: {
              id: true,
              url: true,
              feedUrl: true,
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
          followers: true,
        },
      },
    },
    orderBy: {
      followers: {
        _count: "desc",
      },
    },
    take: 6,
  });
}

export default async function NotFound() {
  const creators = await getTrendingCreators();

  return (
    <main className="relative min-h-svh overflow-hidden bg-zinc-950 px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.18),transparent_48%)]" />
      <div className="pointer-events-none absolute -left-40 top-72 size-[30rem] rounded-full bg-fuchsia-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-36 size-[30rem] rounded-full bg-rose-600/10 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl">
        <section className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="border-rose-500/25 bg-rose-500/10 px-4 py-1.5 text-rose-300">
            Fehler 404
          </Badge>

          <p className="mt-8 bg-linear-to-r from-rose-400 via-pink-500 to-fuchsia-400 bg-clip-text text-8xl font-black tracking-[-0.08em] text-transparent sm:text-9xl">
            404
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Diese Seite ist verschwunden.</h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
            Der Link ist nicht mehr aktuell oder die Seite wurde verschoben. Auf CherryStream gibt es trotzdem genug zu entdecken.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className={cn(
                buttonVariants({
                  size: "lg",
                }),
                "bg-rose-600 text-white shadow-lg shadow-rose-950/40 hover:bg-rose-500",
              )}
            >
              <Home className="size-4" />
              Startseite
            </Link>

            <Link
              href="/creators"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "lg",
                }),
                "border-white/10 bg-white/5 text-white hover:bg-white/10",
              )}
            >
              <Compass className="size-4" />
              Creator entdecken
            </Link>

            <Link
              href="/creators/random"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "lg",
                }),
                "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-500/15",
              )}
            >
              <Shuffle className="size-4" />
              Zufälliges Profil
            </Link>

            <BackButton />
          </div>
        </section>

        {creators.length > 0 ? (
          <section className="mt-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-400">
                  <Flame className="size-4" />

                  <span className="text-sm font-semibold">Gerade beliebt</span>
                </div>

                <h2 className="mt-2 text-2xl font-black sm:text-3xl">Vielleicht suchst du eines dieser Profile</h2>
              </div>

              <Link href="/creators" className="text-sm font-medium text-rose-400 transition hover:text-rose-300">
                Alle Creator ansehen
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {creators.map((creator) => {
                const displayName = creator.profile?.displayName ?? creator.name ?? creator.username;

                const media = creator.posts[0]?.media[0];

                const imageUrl = media?.feedUrl ?? media?.url ?? creator.image;

                const location = [creator.profile?.city, creator.profile?.country].filter(Boolean).join(", ");

                return (
                  <Link
                    key={creator.username}
                    href={`/profile/${creator.username}`}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 transition duration-300 hover:-translate-y-1 hover:border-rose-500/30 hover:shadow-xl hover:shadow-rose-950/20"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-zinc-900">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={displayName}
                          fill
                          sizes="(max-width: 640px) 50vw, 180px"
                          className="object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-linear-to-br from-rose-500/20 via-fuchsia-500/10 to-zinc-900">
                          <Cherry className="size-10 text-rose-300/60" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent" />

                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="truncate text-sm font-bold">{displayName}</p>

                        <p className="mt-1 truncate text-xs text-zinc-400">{location || `@${creator.username}`}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                      <span className="truncate text-xs text-zinc-500">@{creator.username}</span>

                      <span className="shrink-0 text-xs text-zinc-500">{creator._count.followers} Follower</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
