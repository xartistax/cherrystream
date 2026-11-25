import { ArrowRight, ChevronRight, ExternalLink, Pencil, ShieldCheck, Upload } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BusinessMetrics } from "@/components/dashboard/dashboard/business-metrics";
import { DashboardWelcome } from "@/components/dashboard/dashboard/dashboard-welcome";
import { GalleryManager } from "@/components/gallery/gallery-manager";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCreatorPage } from "@/lib/access";
import { getProfileStats } from "@/lib/analytics/get-profile-stats";
import { getGalleryItems } from "@/lib/gallery/get-gallery-items";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const GALLERY_PREVIEW_SIZE = 8;

export default async function DashboardPage() {
  const { userId, modelStatus } = await requireCreatorPage();

  const isPublished = modelStatus === "ACTIVE";

  const [currentUser, galleryItems, profileStats] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
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
    getGalleryItems(userId, GALLERY_PREVIEW_SIZE + 1),
    getProfileStats(userId),
  ]);

  if (!currentUser) {
    redirect("/login");
  }

  const displayName = currentUser.profile?.displayName ?? currentUser.name ?? currentUser.username;
  const hasMoreItems = galleryItems.length > GALLERY_PREVIEW_SIZE;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-400">Hallo, {displayName}</p>

          <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">Dashboard</h1>

          <p className="mt-2 text-sm text-zinc-500">Deine Reichweite, deine Kontakte und deine Galerie.</p>
        </div>

        {isPublished ? (
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
        ) : null}
      </header>

      {!isPublished ? (
        <Link
          href="/dashboard/verification"
          className="flex items-start gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 transition hover:bg-amber-500/15"
        >
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-300" />

          <div className="flex-1">
            <p className="font-semibold text-amber-100">Dein Profil ist noch nicht öffentlich</p>

            <p className="mt-1 text-sm leading-6 text-amber-100/70">
              Wir prüfen jedes Profil vor der Veröffentlichung. Hier reichst du deine Verifizierung ein und siehst den aktuellen Stand.
            </p>
          </div>

          <ChevronRight className="mt-0.5 size-5 shrink-0 text-amber-300" />
        </Link>
      ) : null}

      <DashboardWelcome displayName={displayName} username={currentUser.username} stats={profileStats} />

      <BusinessMetrics stats={profileStats} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Galerie</h2>

              <p className="mt-1 text-sm text-zinc-500">Deine zuletzt hochgeladenen Bilder und Videos.</p>
            </div>

            <div className="flex items-center gap-3">
              {hasMoreItems ? (
                <Link href="/dashboard/gallery" className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-400 hover:text-rose-300">
                  Ganze Galerie
                  <ArrowRight className="size-4" />
                </Link>
              ) : null}

              {isPublished ? (
                <Link href="/dashboard/gallery" className={cn(buttonVariants(), "bg-rose-600 text-white hover:bg-rose-500")}>
                  <Upload className="size-4" />
                  Bilder & Videos hochladen
                </Link>
              ) : null}
            </div>
          </div>

          <GalleryManager items={galleryItems.slice(0, GALLERY_PREVIEW_SIZE)} username={currentUser.username} />
        </section>

        <aside>
          <Card className="border-white/10 bg-zinc-900/60 text-white">
            <CardHeader>
              <CardTitle className="text-base">Dein Profil</CardTitle>

              <CardDescription className="text-zinc-500">So wirst du öffentlich angezeigt. Das Profilbild wählst du in der Galerie.</CardDescription>
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
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
