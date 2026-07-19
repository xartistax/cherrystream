import { ArrowLeft, ArrowRight, Camera, Search, SlidersHorizontal, Sparkles, UsersRound, Video } from "lucide-react";
import Link from "next/link";

import { CreatorGrid } from "@/components/public/creator-grid";
import type { CreatorCardData } from "@/components/public/creator-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { Prisma } from "@/generated/prisma/client";
import { LocationFilter } from "@/components/profile/location-filter";

type CreatorsPageProps = {
  searchParams: Promise<{
    category?: string;
    canton?: string;
    city?: string;
    media?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
};

type CreatorSort = "newest" | "trending";
type MediaFilter = "IMAGE" | "VIDEO";

const PAGE_SIZE = 24;

export const metadata = {
  title: "Creator entdecken",
  description: "Entdecke öffentliche Creator-Profile auf CherryStream.",
};

function parsePage(value: string | undefined): number {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function createCreatorsUrl(
  current: {
    category?: string;
    canton?: string;
    city?: string;
    media?: string;
    search?: string;
    sort?: string;
  },
  updates: Record<string, string | null>,
): string {
  const params = new URLSearchParams();

  Object.entries(current).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  Object.entries(updates).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  });

  const query = params.toString();

  return query ? `/explore?${query}` : "/explore";
}

export default async function CreatorsPage({ searchParams }: CreatorsPageProps) {
  const params = await searchParams;

  const categorySlug = params.category?.trim().toLowerCase() || undefined;

  const cantonSlug = params.canton?.trim().toLowerCase() || undefined;

  const citySlug = cantonSlug ? params.city?.trim().toLowerCase() || undefined : undefined;

  const search = params.search?.trim() || undefined;

  const mediaType: MediaFilter | undefined = params.media === "IMAGE" || params.media === "VIDEO" ? params.media : undefined;

  const sort: CreatorSort = params.sort === "trending" ? "trending" : "newest";

  const page = parsePage(params.page);

  const currentFilters = {
    category: categorySlug,
    canton: cantonSlug,
    city: citySlug,
    media: mediaType,
    search,
    sort: sort === "trending" ? sort : undefined,
  };

  const creatorWhere: Prisma.UserWhereInput = {
    status: "ACTIVE",
    role: "MODEL",
    modelStatus: "ACTIVE",
    profile: {
      is: {
        isPublic: true,

        ...(categorySlug
          ? {
              categories: {
                some: {
                  category: {
                    slug: categorySlug,
                    isActive: true,
                  },
                },
              },
            }
          : {}),

        ...(cantonSlug
          ? {
              canton: {
                is: {
                  slug: cantonSlug,
                },
              },
            }
          : {}),

        ...(citySlug
          ? {
              city: {
                is: {
                  slug: citySlug,
                  canton: {
                    is: {
                      slug: cantonSlug,
                    },
                  },
                },
              },
            }
          : {}),
      },
    },

    ...(search
      ? {
          OR: [
            {
              username: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              profile: {
                is: {
                  displayName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            },
            {
              profile: {
                is: {
                  city: {
                    is: {
                      name: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                },
              },
            },
            {
              profile: {
                is: {
                  canton: {
                    is: {
                      name: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                },
              },
            },
          ],
        }
      : {}),

    ...(mediaType
      ? {
          posts: {
            some: {
              status: "PUBLISHED",
              media: {
                some: {
                  type: mediaType,
                  status: "READY",
                },
              },
            },
          },
        }
      : {}),
  };

  const [categories, cantons, cities, totalCount, creators] = await Promise.all([
    prisma.category.findMany({
      where: {
        isActive: true,
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
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),

    prisma.canton.findMany({
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
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),

    prisma.city.findMany({
      select: {
        name: true,
        slug: true,
        canton: {
          select: {
            slug: true,
          },
        },
        _count: {
          select: {
            profiles: true,
          },
        },
      },
      orderBy: [
        {
          canton: {
            sortOrder: "asc",
          },
        },
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),

    prisma.user.count({
      where: creatorWhere,
    }),

    prisma.user.findMany({
      where: creatorWhere,

      select: {
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
            followers: true,
          },
        },
      },

      orderBy:
        sort === "trending"
          ? [
              {
                followers: {
                  _count: "desc",
                },
              },
              {
                createdAt: "desc",
              },
            ]
          : {
              createdAt: "desc",
            },

      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const creatorIds = creators.map((creator) => creator.id);

  const creatorMedia =
    creatorIds.length > 0
      ? await prisma.postMedia.findMany({
          where: {
            status: "READY",
            post: {
              authorId: {
                in: creatorIds,
              },
              status: "PUBLISHED",
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

  const mediaCounts = new Map<
    string,
    {
      images: number;
      videos: number;
    }
  >();

  creatorIds.forEach((creatorId) => {
    mediaCounts.set(creatorId, {
      images: 0,
      videos: 0,
    });
  });

  creatorMedia.forEach((media) => {
    const count = mediaCounts.get(media.post.authorId);

    if (!count) {
      return;
    }

    if (media.type === "VIDEO") {
      count.videos += 1;
    } else {
      count.images += 1;
    }
  });

  const normalizedCreators: CreatorCardData[] = creators.map((creator) => ({
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

    mediaCounts: mediaCounts.get(creator.id) ?? {
      images: 0,
      videos: 0,
    },
  }));

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const activeCategory = categories.find((category) => category.slug === categorySlug);
  const activeCanton = cantons.find((canton) => canton.slug === cantonSlug);

  const activeCity = cities.find((city) => city.slug === citySlug);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8 lg:px-8">
      <section className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Entdecken</h1>

            <p className="mt-2 text-sm text-zinc-400 sm:text-base">Finde Profile nach Interessen, Ort oder Medien.</p>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-300">
              {totalCount} Profile
            </Badge>

            <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-300">
              {categories.length} Kategorien
            </Badge>

            <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-300">
              18+
            </Badge>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-white/10 bg-zinc-900/50 p-4 sm:p-6">
        <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px_180px_auto]">
          {categorySlug ? <input type="hidden" name="category" value={categorySlug} /> : null}

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />

            <Input
              name="search"
              defaultValue={search}
              placeholder="Name, Benutzername oder Stadt ..."
              className="h-11 border-white/10 bg-white/[0.04] pl-11 text-white"
            />
          </div>

          <LocationFilter
            cantons={cantons.map((canton) => ({
              name: canton.name,
              slug: canton.slug,
              count: canton._count.profiles,
            }))}
            cities={cities.map((city) => ({
              name: city.name,
              slug: city.slug,
              cantonSlug: city.canton.slug,
              count: city._count.profiles,
            }))}
            initialCantonSlug={cantonSlug}
            initialCitySlug={citySlug}
          />

          <select
            name="media"
            defaultValue={mediaType ?? ""}
            className="h-11 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-300 outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="">Alle Medien</option>
            <option value="IMAGE">Mit Fotos</option>
            <option value="VIDEO">Mit Videos</option>
          </select>

          <select
            name="sort"
            defaultValue={sort}
            className="h-11 rounded-md border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-300 outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="newest">Neueste zuerst</option>
            <option value="trending">Beliebteste zuerst</option>
          </select>

          <Button type="submit" className="h-11 bg-rose-600 text-white hover:bg-rose-500">
            <SlidersHorizontal className="size-4" />
            Filtern
          </Button>
        </form>

        <nav className="mt-5 flex flex-wrap gap-2">
          <Link
            href={createCreatorsUrl(currentFilters, {
              category: null,
              page: null,
            })}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              !categorySlug
                ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                : "border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.07] hover:text-white",
            )}
          >
            Alle Kategorien
          </Link>

          {categories.map((category) => {
            const active = category.slug === categorySlug;

            return (
              <Link
                key={category.slug}
                href={createCreatorsUrl(currentFilters, {
                  category: active ? null : category.slug,
                  page: null,
                })}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                  active
                    ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                    : "border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.07] hover:text-white",
                )}
              >
                {category.name}

                <span className="ml-2 text-xs opacity-50">{category._count.profiles}</span>
              </Link>
            );
          })}
        </nav>

        {search || categorySlug || cantonSlug || citySlug || mediaType ? (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
            <span className="text-xs text-zinc-500">Aktive Filter:</span>

            {search ? (
              <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-300">
                Suche: {search}
              </Badge>
            ) : null}

            {activeCategory ? (
              <Badge variant="outline" className="border-rose-500/20 bg-rose-500/10 text-rose-300">
                {activeCategory.name}
              </Badge>
            ) : null}

            {activeCanton ? (
              <Badge variant="outline" className="border-sky-500/20 bg-sky-500/10 text-sky-300">
                Kanton: {activeCanton.name}
              </Badge>
            ) : null}

            {activeCity ? (
              <Badge variant="outline" className="border-violet-500/20 bg-violet-500/10 text-violet-300">
                Stadt: {activeCity.name}
              </Badge>
            ) : null}

            {mediaType ? (
              <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-300">
                {mediaType === "VIDEO" ? <Video className="size-3" /> : <Camera className="size-3" />}

                {mediaType === "VIDEO" ? "Videos" : "Fotos"}
              </Badge>
            ) : null}

            <Link href="/explore" className="ml-auto text-xs font-medium text-rose-400 hover:text-rose-300">
              Filter zurücksetzen
            </Link>
          </div>
        ) : null}
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{activeCategory ? activeCategory.name : "Profile"}</h2>

            <p className="mt-1 text-sm text-zinc-500">{totalCount} Ergebnisse</p>
          </div>

          <p className="text-sm text-zinc-500">
            Seite {Math.min(page, totalPages)} von {totalPages}
          </p>
        </div>

        <CreatorGrid creators={normalizedCreators} priorityCount={4} />
      </section>

      {totalPages > 1 ? (
        <nav aria-label="Seitennavigation" className="mt-12 flex items-center justify-center gap-3">
          {page > 1 ? (
            <Link
              href={createCreatorsUrl(currentFilters, {
                page: String(page - 1),
              })}
              className={cn(
                buttonVariants({
                  variant: "outline",
                }),
                "border-white/10 bg-white/5 text-white hover:bg-white/10",
              )}
            >
              <ArrowLeft className="size-4" />
              Zurück
            </Link>
          ) : (
            <span
              className={cn(
                buttonVariants({
                  variant: "outline",
                }),
                "pointer-events-none border-white/5 bg-white/2 text-zinc-700",
              )}
            >
              <ArrowLeft className="size-4" />
              Zurück
            </span>
          )}

          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400">
            {page} / {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              href={createCreatorsUrl(currentFilters, {
                page: String(page + 1),
              })}
              className={cn(buttonVariants(), "bg-rose-600 text-white hover:bg-rose-500")}
            >
              Weiter
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <span className={cn(buttonVariants(), "pointer-events-none bg-zinc-800 text-zinc-600")}>
              Weiter
              <ArrowRight className="size-4" />
            </span>
          )}
        </nav>
      ) : null}
    </main>
  );
}
