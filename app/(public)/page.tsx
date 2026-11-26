import { ArrowRight, Camera, Cherry, Flame, MapPin, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { applyDueAutoBumps } from "@/lib/boosts/apply-auto-bumps";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";

export const revalidate = 60;

/** Profiles younger than this get a "Neu" badge. */
const NEW_PROFILE_DAYS = 14;

async function getHomeData() {
  await applyDueAutoBumps();

  return Promise.all([
    prisma.user.findMany({
      where: {
        status: "ACTIVE",
        role: "MODEL",
        modelStatus: "ACTIVE",
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
        createdAt: true,

        profile: {
          select: {
            displayName: true,
            bio: true,
            highlightUntil: true,

            city: {
              select: {
                name: true,
              },
            },

            canton: {
              select: {
                name: true,
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
                id: true,
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
            followers: true,
          },
        },
      },
      // Same order as the default listing on /explore: most recently bumped first (docs/ranking.md).
      orderBy: [
        {
          profile: {
            bumpedAt: {
              sort: "desc",
              nulls: "last",
            },
          },
        },
        {
          createdAt: "desc",
        },
      ],
      take: 12,
    }),

    prisma.user.count({
      where: {
        status: "ACTIVE",
        profile: {
          is: {
            isPublic: true,
          },
        },
      },
    }),

    prisma.category.findMany({
      where: {
        isActive: true,
        profiles: {
          some: {
            profile: {
              isPublic: true,
            },
          },
        },
      },
      select: {
        name: true,
        slug: true,
        _count: {
          select: {
            profiles: true,
          },
        },
      },
      orderBy: [
        {
          profiles: {
            _count: "desc",
          },
        },
        {
          sortOrder: "asc",
        },
      ],
      take: 8,
    }),
  ]);
}

export default async function PublicHomePage() {
  const [creators, creatorCount, categories] = await getHomeData();
  const session = await auth();
  const profileCtaHref = session?.user ? (session.user.role === "USER" ? "/become-model" : "/dashboard") : "/register";
  const now = new Date();
  const newSince = new Date(now.getTime() - NEW_PROFILE_DAYS * 24 * 60 * 60 * 1000);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-12 size-[32rem] -translate-x-1/2 rounded-full bg-rose-600/15 blur-[120px]" />
          <div className="absolute -left-32 top-72 size-96 rounded-full bg-fuchsia-600/10 blur-[100px]" />
          <div className="absolute -right-32 top-40 size-96 rounded-full bg-orange-500/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto grid min-h-[calc(82svh-4rem)] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <Badge variant="outline" className="gap-2 border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-rose-300">
              <Sparkles className="size-3.5" />
              Neu auf CherryStream
            </Badge>

            <h1 className="mt-6 text-balance text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              Entdecke Profile, die{" "}
              <span className="bg-gradient-to-r from-rose-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">dich begeistern.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-400 sm:text-xl">
              Finde Profile nach Rubrik, Kanton und Stadt – mit Fotos, Videos und exklusiven Inhalten.
            </p>

            <div className="flex flex-col gap-3 mt-10 sm:flex-row">
              <Link
                href="/explore"
                className={cn(
                  buttonVariants({
                    size: "lg",
                  }),
                  "h-12 rounded-2xl bg-rose-600 px-7 text-base font-semibold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500",
                )}
              >
                Profile entdecken
                <ArrowRight className="size-5" />
              </Link>

              <Link
                href={profileCtaHref}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    size: "lg",
                  }),
                  "h-12 rounded-2xl border-white/15 bg-white/5 px-7 text-base font-semibold text-white backdrop-blur-sm hover:border-white/25 hover:bg-white/10 hover:text-white",
                )}
              >
                <Sparkles className="size-5 text-rose-400" />
                Profil veröffentlichen
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-zinc-500">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400" />
                Ausschließlich 18+
              </span>

              <span className="inline-flex items-center gap-2">
                <UsersRound className="size-4 text-rose-400" />
                Öffentliche Profile
              </span>

              <span className="inline-flex items-center gap-2">
                <Camera className="size-4 text-violet-400" />
                Fotos und Videos
              </span>
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-lg lg:block">
            <div className="absolute inset-12 rounded-full bg-rose-500/20 blur-3xl" />

            <div className="relative grid grid-cols-2 gap-4">
              {creators.slice(0, 4).map((creator, index) => {
                const displayName = creator.profile?.displayName ?? creator.name ?? creator.username;

                const media = creator.posts[0]?.media[0];

                const imageUrl = creator.image ?? (media?.type === "VIDEO" ? (media.posterUrl ?? media.feedUrl ?? media.url) : (media?.feedUrl ?? media?.url));

                const location = [creator.profile?.city?.name, creator.profile?.canton?.name].filter(Boolean).join(", ");

                return (
                  <Link
                    key={creator.username}
                    href={`/profile/${creator.username}`}
                    className={cn(
                      "group relative overflow-hidden rounded-[2rem] border bg-zinc-900 shadow-2xl shadow-black/30",
                      creator.profile?.highlightUntil && creator.profile.highlightUntil > now ? "border-rose-500/70 ring-2 ring-rose-500/40" : "border-white/10",
                      index === 1 || index === 2 ? "translate-y-8" : "",
                    )}
                  >
                    <div className="relative aspect-[4/5]">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={displayName}
                          fill
                          priority={index < 2}
                          sizes="260px"
                          className="object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-gradient-to-br from-rose-500/30 via-fuchsia-500/15 to-zinc-900">
                          <Cherry className="size-12 text-rose-300/70" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="truncate font-semibold text-white">{displayName}</p>

                        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-zinc-300">
                          {location ? (
                            <>
                              <MapPin className="size-3 shrink-0 text-rose-400" />
                              {location}
                            </>
                          ) : (
                            `@${creator.username}`
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-center sm:grid-cols-3 sm:px-6 lg:px-8">
          <div>
            <p className="text-3xl font-black text-white">{creatorCount}</p>

            <p className="mt-1 text-sm text-zinc-500">öffentliche Profile</p>
          </div>

          <div>
            <p className="text-3xl font-black text-white">{categories.length}</p>

            <p className="mt-1 text-sm text-zinc-500">beliebte Rubriken</p>
          </div>

          <div>
            <p className="text-3xl font-black text-white">18+</p>

            <p className="mt-1 text-sm text-zinc-500">ausschließlich für Erwachsene</p>
          </div>
        </div>
      </section>

      {categories.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8 lg:pt-20">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="outline" className="border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300">
                Rubriken
              </Badge>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">Nach Interessen entdecken</h2>

              <p className="mt-3 max-w-xl text-zinc-500">Durchsuche Profile nach Rubriken und Schwerpunkten.</p>
            </div>

            <Link href="/explore" className="inline-flex items-center gap-2 text-sm font-semibold text-rose-400 transition hover:text-rose-300">
              Alle Rubriken
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/explore?category=${category.slug}`}
                className="group rounded-2xl border border-white/10 bg-zinc-900/60 px-5 py-4 transition hover:-translate-y-0.5 hover:border-rose-500/30 hover:bg-rose-500/5"
              >
                <span className="font-semibold text-white transition group-hover:text-rose-300">{category.name}</span>

                <span className="ml-3 text-sm text-zinc-600">{category._count.profiles}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline" className="gap-2 border-orange-500/20 bg-orange-500/10 text-orange-300">
              <Flame className="size-3.5" />
              Gerade aktiv
            </Badge>

            <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">Aktuelle Profile</h2>

            <p className="mt-3 max-w-xl text-zinc-500">Die Profile, die gerade aktiv sind, zuerst.</p>
          </div>

          <Link href="/explore" className="inline-flex items-center gap-2 text-sm font-semibold text-rose-400 transition hover:text-rose-300">
            Alle Profile ansehen
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {creators.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {creators.map((creator) => {
              const displayName = creator.profile?.displayName ?? creator.name ?? creator.username;

              const media = creator.posts[0]?.media[0];

              const imageUrl = creator.image ?? (media?.type === "VIDEO" ? (media.posterUrl ?? media.feedUrl ?? media.url) : (media?.feedUrl ?? media?.url));

              const location = [creator.profile?.city?.name, creator.profile?.canton?.name].filter(Boolean).join(", ");

              const highlighted = Boolean(creator.profile?.highlightUntil && creator.profile.highlightUntil > now);

              return (
                <Link
                  key={creator.username}
                  href={`/profile/${creator.username}`}
                  className={cn(
                    "group overflow-hidden rounded-2xl border bg-zinc-900/70 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-950/20 sm:rounded-3xl",
                    highlighted ? "border-rose-500/70 ring-2 ring-rose-500/40" : "border-white/10 hover:border-rose-500/30",
                  )}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-zinc-900">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={displayName}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-gradient-to-br from-rose-500/25 via-pink-500/10 to-zinc-900">
                        <Cherry className="size-12 text-rose-300/60" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-transparent" />

                    {highlighted ? (
                      <Badge className="absolute left-3 top-3 gap-1 border-0 bg-rose-600 text-[10px] font-bold uppercase text-white hover:bg-rose-600">
                        <Sparkles className="size-3" />
                        Top
                      </Badge>
                    ) : creator.createdAt > newSince ? (
                      <Badge className="absolute left-3 top-3 border-white/10 bg-black/50 text-[10px] text-white backdrop-blur-md hover:bg-black/50">Neu</Badge>
                    ) : null}

                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                      <p className="truncate text-sm font-bold text-white sm:text-base">{displayName}</p>

                      <p className="mt-1 truncate text-xs text-zinc-300">{location || `@${creator.username}`}</p>

                      {creator.profile?.categories.length ? (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {creator.profile.categories.slice(0, 2).map(({ category }) => (
                            <span
                              key={category.slug}
                              className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[10px] text-zinc-200 backdrop-blur"
                            >
                              {category.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
                    <p className="min-w-0 truncate text-xs text-zinc-500">@{creator.username}</p>

                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-zinc-400">
                      <Camera className="size-3.5" />
                      {creator._count.posts}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-10 flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
              <UsersRound className="size-6" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-white">Noch keine öffentlichen Profile</h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">Sobald neue Profile veröffentlicht werden, erscheinen sie automatisch hier.</p>

            <Link href="/register" className={cn(buttonVariants(), "mt-6 bg-rose-600 text-white hover:bg-rose-500")}>
              Erstes Profil erstellen
            </Link>
          </div>
        )}
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-rose-500/20 bg-gradient-to-br from-rose-600/20 via-zinc-900 to-fuchsia-600/10 px-6 py-14 text-center shadow-2xl shadow-rose-950/20 sm:px-10 lg:py-20">
          <div className="pointer-events-none absolute left-1/2 top-0 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/20 blur-3xl" />

          <div className="relative mx-auto max-w-2xl">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-xl shadow-rose-600/30">
              <Cherry className="size-6" />
            </div>

            <h2 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl">Zeig, was dich besonders macht.</h2>

            <p className="mt-4 text-base leading-7 text-zinc-400">Erstelle dein Profil, veröffentliche deine Inhalte und werde auf CherryStream entdeckt.</p>

            <Link
              href="/register"
              className={cn(
                buttonVariants({
                  size: "lg",
                }),
                "mt-8 h-12 bg-white px-7 text-zinc-950 hover:bg-zinc-200",
              )}
            >
              Eigenes Profil veröffentlichen
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
