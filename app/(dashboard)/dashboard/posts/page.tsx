import { ArrowLeft, FileImage, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PostGrid } from "@/components/dashboard/posts/post-grid";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireCreatorPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type StudioPostsPageProps = {
  searchParams: Promise<{
    visibility?: string;
    search?: string;
  }>;
};

const visibilityOptions = [
  {
    label: "Alle",
    value: "all",
  },
  {
    label: "Öffentlich",
    value: "PUBLIC",
  },
  {
    label: "Follower",
    value: "FOLLOWERS",
  },
  {
    label: "Premium",
    value: "PREMIUM",
  },
] as const;

export const metadata = {
  title: "Inhalte verwalten",
};

export default async function StudioPostsPage({ searchParams }: StudioPostsPageProps) {
  const { userId } = await requireCreatorPage();

  const params = await searchParams;

  const search = params.search?.trim() ?? "";

  const visibility = params.visibility === "PUBLIC" || params.visibility === "FOLLOWERS" || params.visibility === "PREMIUM" ? params.visibility : null;

  const [currentUser, posts, totalCount] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        username: true,
      },
    }),

    prisma.post.findMany({
      where: {
        authorId: userId,
        status: {
          not: "DELETED",
        },
        ...(visibility
          ? {
              visibility,
            }
          : {}),
        ...(search
          ? {
              content: {
                contains: search,
                mode: "insensitive",
              },
            }
          : {}),
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
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 60,
    }),

    prisma.post.count({
      where: {
        authorId: userId,
        status: {
          not: "DELETED",
        },
      },
    }),
  ]);

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard"
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
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Inhalte</h1>

              <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-400">
                {totalCount}
              </Badge>
            </div>

            <p className="mt-2 text-sm text-zinc-500">Verwalte deine veröffentlichten Fotos, Videos und Premium-Inhalte.</p>
          </div>
        </div>

        <Link href="/dashboard#publish" className={cn(buttonVariants(), "bg-rose-600 text-white hover:bg-rose-500")}>
          <FileImage className="size-4" />
          Neue Veröffentlichung
        </Link>
      </header>

      <section className="space-y-5">
        <form className="relative max-w-xl">
          {visibility ? <input type="hidden" name="visibility" value={visibility} /> : null}

          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />

          <Input
            name="search"
            defaultValue={search}
            placeholder="Beschreibung durchsuchen ..."
            className="h-11 border-white/10 bg-white/[0.04] pl-11 text-white"
          />
        </form>

        <nav className="flex flex-wrap gap-2">
          {visibilityOptions.map((option) => {
            const active = option.value === "all" ? visibility === null : visibility === option.value;

            const query = new URLSearchParams();

            if (option.value !== "all") {
              query.set("visibility", option.value);
            }

            if (search) {
              query.set("search", search);
            }

            const href = query.size > 0 ? `/dashboard/posts?${query.toString()}` : "/dashboard/posts";

            return (
              <Link
                key={option.value}
                href={href}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                  active
                    ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                    : "border-white/10 bg-white/3 text-zinc-400 hover:bg-white/[0.07] hover:text-white",
                )}
              >
                {option.label}
              </Link>
            );
          })}
        </nav>
      </section>

      <PostGrid posts={posts} username={currentUser.username} />
    </div>
  );
}
