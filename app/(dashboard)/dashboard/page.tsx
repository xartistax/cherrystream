import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCreatorPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { CreatePostComposer } from "@/components/dashboard/create-post/composer";
import { ComposerUser } from "@/components/dashboard/create-post/types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, ChevronRight, Coins, ExternalLink, FileImage, Pencil, Plus, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostGrid } from "@/components/dashboard/posts/post-grid";
import { getProfileStats } from "@/lib/analytics/get-profile-stats";
import { BusinessMetrics } from "@/components/dashboard/dashboard/business-metrics";
import { DashboardWelcome } from "@/components/dashboard/dashboard/dashboard-welcome";

export default async function FeedPage() {
  const { userId } = await requireCreatorPage();

  const [currentUser, posts, profileStats] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        profile: {
          select: {
            displayName: true,
          },
        },
      },
    }),

    prisma.post.findMany({
      where: {
        authorId: userId,
        status: "PUBLISHED",
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
            unlocks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    }),

    getProfileStats(userId),
  ]);

  if (!currentUser) {
    redirect("/login");
  }

  const displayName = currentUser.profile?.displayName ?? currentUser.name ?? currentUser.username;

  const recentPosts = posts.slice(0, 6);

  const composerUser: ComposerUser = {
    id: currentUser.id,

    displayName,

    image: currentUser.image,
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-400">Hallo, {displayName}</p>

          <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">Dashboard</h1>

          <p className="mt-2 text-sm text-zinc-500">Verwalte dein Profil, deine Inhalte und deine Einnahmen.</p>
        </div>

        <Link
          href={`/profile/${currentUser.username}`}
          className={cn(
            buttonVariants({
              variant: "outline",
            }),
            "border-white/10 bg-white/5 text-white hover:bg-white/10",
          )}
        >
          <ExternalLink className="size-4" />
          Öffentliches Profil ansehen
        </Link>
      </header>

      <DashboardWelcome displayName={displayName} username={currentUser.username} stats={profileStats} />

      <BusinessMetrics stats={profileStats} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          <section id="publish">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                  <Plus className="size-4" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white">Neue Veröffentlichung</h2>

                  <p className="text-sm text-zinc-500">Lade Bilder oder Videos hoch und füge optional eine Beschreibung hinzu.</p>
                </div>
              </div>
            </div>

            <CreatePostComposer user={composerUser} />
          </section>

          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Letzte Inhalte</h2>

                <p className="mt-1 text-sm text-zinc-500">Deine zuletzt veröffentlichten Medien.</p>
              </div>

              {posts.length > 6 ? (
                <Link href="/dashboard/posts" className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-400 hover:text-rose-300">
                  Alle verwalten
                  <ArrowRight className="size-4" />
                </Link>
              ) : null}
            </div>

            <PostGrid posts={recentPosts} username={currentUser.username} />
          </section>
        </div>

        <aside className="space-y-5">
          <Card className="border-white/10 bg-zinc-900/60 text-white">
            <CardHeader>
              <CardTitle className="text-base">Dein Profil</CardTitle>

              <CardDescription className="text-zinc-500">So wirst du öffentlich angezeigt.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-12 border border-white/10">
                  <AvatarImage src={currentUser.image ?? undefined} alt={displayName} />

                  <AvatarFallback className="bg-rose-500/10 text-rose-300">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{displayName}</p>

                  <p className="truncate text-sm text-zinc-500">@{currentUser.username}</p>
                </div>
              </div>

              <Link href="/profile/edit" className={cn(buttonVariants(), "w-full bg-rose-600 text-white hover:bg-rose-500")}>
                <Pencil className="size-4" />
                Profil bearbeiten
              </Link>

              <Link
                href={`/profile/${currentUser.username}`}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                  }),
                  "w-full border-white/10 bg-white/5 text-white hover:bg-white/10",
                )}
              >
                <ExternalLink className="size-4" />
                Öffentlich ansehen
              </Link>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/60 text-white">
            <CardHeader>
              <CardTitle className="text-base">Schnellzugriff</CardTitle>
            </CardHeader>

            <CardContent className="space-y-1">
              <Link
                href="/dashboard/posts"
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <FileImage className="size-4" />
                  Inhalte verwalten
                </span>

                <ChevronRight className="size-4" />
              </Link>

              <Link
                href="/profile/edit"
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <UserRound className="size-4" />
                  Profil bearbeiten
                </span>

                <ChevronRight className="size-4" />
              </Link>

              <Link
                href="/credits"
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <Coins className="size-4" />
                  Credits
                </span>

                <ChevronRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
