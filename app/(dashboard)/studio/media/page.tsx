import { ArrowLeft, FileImage, Images, Search, Video } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MediaGrid } from "@/components/studio/media/media-grid";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type StudioMediaPageProps = {
  searchParams: Promise<{
    type?: string;
    search?: string;
  }>;
};

const mediaTypeOptions = [
  {
    label: "Alle",
    value: "all",
  },
  {
    label: "Fotos",
    value: "IMAGE",
  },
  {
    label: "Videos",
    value: "VIDEO",
  },
] as const;

export const metadata = {
  title: "Medienbibliothek",
};

export default async function StudioMediaPage({ searchParams }: StudioMediaPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const search = params.search?.trim() ?? "";

  const selectedType = params.type === "IMAGE" || params.type === "VIDEO" ? params.type : null;

  const baseWhere = {
    status: "READY" as const,
    post: {
      authorId: session.user.id,
      status: {
        not: "DELETED" as const,
      },
    },
  };

  const [media, totalCount, imageCount, videoCount] = await Promise.all([
    prisma.postMedia.findMany({
      where: {
        ...baseWhere,

        ...(selectedType
          ? {
              type: selectedType,
            }
          : {}),

        ...(search
          ? {
              post: {
                authorId: session.user.id,
                status: {
                  not: "DELETED",
                },
                content: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            }
          : {}),
      },

      select: {
        id: true,
        type: true,
        url: true,
        feedUrl: true,
        fullUrl: true,
        posterUrl: true,
        mimeType: true,
        size: true,
        width: true,
        height: true,
        duration: true,
        createdAt: true,

        post: {
          select: {
            id: true,
            content: true,

            _count: {
              select: {
                media: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 100,
    }),

    prisma.postMedia.count({
      where: baseWhere,
    }),

    prisma.postMedia.count({
      where: {
        ...baseWhere,
        type: "IMAGE",
      },
    }),

    prisma.postMedia.count({
      where: {
        ...baseWhere,
        type: "VIDEO",
      },
    }),
  ]);

  const normalizedMedia = media.map((item) => ({
    id: item.id,
    type: item.type,
    url: item.url,
    feedUrl: item.feedUrl,
    fullUrl: item.fullUrl,
    posterUrl: item.posterUrl,
    mimeType: item.mimeType,
    size: item.size,
    width: item.width,
    height: item.height,
    duration: item.duration,
    createdAt: item.createdAt,

    post: {
      id: item.post.id,
      content: item.post.content,
      mediaCount: item.post._count.media,
    },
  }));

  const countByType = {
    all: totalCount,
    IMAGE: imageCount,
    VIDEO: videoCount,
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/studio"
            aria-label="Zurück zum Studio"
            className={cn(
              buttonVariants({
                variant: "outline",
                size: "icon",
              }),
              "shrink-0 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white",
            )}
          >
            <ArrowLeft className="size-4" />
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Medienbibliothek</h1>

              <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-400">
                {totalCount}
              </Badge>
            </div>

            <p className="mt-2 text-sm text-zinc-500">Alle veröffentlichten Bilder und Videos an einem Ort.</p>
          </div>
        </div>

        <Link href="/studio#publish" className={cn(buttonVariants(), "bg-rose-600 text-white hover:bg-rose-500")}>
          <FileImage className="size-4" />
          Medien hochladen
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-zinc-900/60 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Alle Medien</span>

              <Images className="size-4 text-rose-400" />
            </div>

            <p className="mt-3 text-3xl font-black">{totalCount}</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-900/60 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Fotos</span>

              <FileImage className="size-4 text-violet-400" />
            </div>

            <p className="mt-3 text-3xl font-black">{imageCount}</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-900/60 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Videos</span>

              <Video className="size-4 text-sky-400" />
            </div>

            <p className="mt-3 text-3xl font-black">{videoCount}</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5">
        <form className="relative max-w-xl">
          {selectedType ? <input type="hidden" name="type" value={selectedType} /> : null}

          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />

          <Input
            name="search"
            defaultValue={search}
            placeholder="Beschreibung durchsuchen ..."
            className="h-11 border-white/10 bg-white/[0.04] pl-11 text-white"
          />
        </form>

        <nav className="flex flex-wrap gap-2">
          {mediaTypeOptions.map((option) => {
            const active = option.value === "all" ? selectedType === null : selectedType === option.value;

            const query = new URLSearchParams();

            if (option.value !== "all") {
              query.set("type", option.value);
            }

            if (search) {
              query.set("search", search);
            }

            const href = query.size > 0 ? `/studio/media?${query.toString()}` : "/studio/media";

            return (
              <Link
                key={option.value}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                  active
                    ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                    : "border-white/10 bg-white/3 text-zinc-400 hover:bg-white/[0.07] hover:text-white",
                )}
              >
                {option.label}

                <span className="text-xs opacity-60">{countByType[option.value]}</span>
              </Link>
            );
          })}
        </nav>
      </section>

      <MediaGrid media={normalizedMedia} />
    </div>
  );
}
