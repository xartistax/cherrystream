import { ArrowLeft, CalendarDays, Coins, ExternalLink, FileImage, Heart, Images, Play, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PostMenu } from "@/components/dashboard/posts/post-menu";
import { VisibilityBadge } from "@/components/dashboard/posts/visibility-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCreatorPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { EditPostForm } from "@/components/dashboard/posts/edit-post-form";

type StudioPostPageProps = {
  params: Promise<{
    postId: string;
  }>;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("de-CH", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(duration: number | null): string | null {
  if (!duration) {
    return null;
  }

  const totalSeconds = Math.round(duration);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default async function StudioPostPage({ params }: StudioPostPageProps) {
  const { userId } = await requireCreatorPage();

  const { postId } = await params;

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      authorId: userId,
      status: {
        not: "DELETED",
      },
    },
    select: {
      id: true,
      content: true,
      visibility: true,
      unlockPrice: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          username: true,
        },
      },
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
          pathname: true,
          mimeType: true,
          size: true,
          feedUrl: true,
          fullUrl: true,
          posterUrl: true,
          duration: true,
          width: true,
          height: true,
        },
      },
      _count: {
        select: {
          likes: true,
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  const firstMedia = post.media[0];

  const previewUrl = firstMedia?.type === "VIDEO" ? (firstMedia.posterUrl ?? firstMedia.feedUrl ?? firstMedia.url) : (firstMedia?.feedUrl ?? firstMedia?.url);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/posts"
            aria-label="Zurück zu den Inhalten"
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
              <h1 className="text-3xl font-black tracking-tight text-white">Inhalt verwalten</h1>

              <VisibilityBadge visibility={post.visibility} />
            </div>

            <p className="mt-2 text-sm text-zinc-500">Veröffentlicht am {formatDate(post.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/profile/${post.author.username}?post=${post.id}`}
            className={cn(
              buttonVariants({
                variant: "outline",
              }),
              "border-white/10 bg-white/5 text-white hover:bg-white/10",
            )}
          >
            <ExternalLink className="size-4" />
            Öffentlich ansehen
          </Link>

          <PostMenu postId={post.id} username={post.author.username} />
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card className="overflow-hidden border-white/10 bg-zinc-900/60 text-white">
            <CardContent className="p-0">
              <div className="relative aspect-video overflow-hidden bg-black">
                {previewUrl ? (
                  firstMedia?.type === "VIDEO" ? (
                    <video
                      src={firstMedia.fullUrl ?? firstMedia.url}
                      poster={firstMedia.posterUrl ?? firstMedia.feedUrl ?? undefined}
                      controls
                      playsInline
                      preload="metadata"
                      className="size-full object-contain"
                    />
                  ) : (
                    <Image
                      src={previewUrl}
                      alt={post.content ?? "Veröffentlichung"}
                      fill
                      priority
                      sizes="(max-width: 1280px) 100vw, 900px"
                      className="object-contain"
                    />
                  )
                ) : (
                  <div className="flex size-full items-center justify-center text-zinc-700">
                    <FileImage className="size-12" />
                  </div>
                )}

                {post.media.length > 1 ? (
                  <Badge className="absolute right-4 top-4 gap-1.5 border-white/10 bg-black/70 text-white hover:bg-black/70">
                    <Images className="size-3.5" />
                    {post.media.length} Medien
                  </Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {post.media.length > 1 ? (
            <section>
              <h2 className="mb-4 text-lg font-bold text-white">Enthaltene Medien</h2>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {post.media.map((media) => {
                  const thumbnailUrl = media.type === "VIDEO" ? (media.posterUrl ?? media.feedUrl ?? media.url) : (media.feedUrl ?? media.url);

                  return (
                    <div key={media.id} className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
                      <Image src={thumbnailUrl} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />

                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />

                      {media.type === "VIDEO" ? (
                        <div className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur">
                          <Play className="ml-0.5 size-4 fill-current" />
                        </div>
                      ) : null}

                      <span className="absolute bottom-3 left-3 text-xs font-medium text-white">{media.type === "VIDEO" ? "Video" : "Foto"}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <Card className="border-white/10 bg-zinc-900/60 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Veröffentlichung bearbeiten</CardTitle>

              <CardDescription className="text-zinc-500">Passe Beschreibung, Sichtbarkeit und Premium-Preis an.</CardDescription>
            </CardHeader>

            <CardContent>
              <EditPostForm
                post={{
                  id: post.id,
                  content: post.content,
                  visibility: post.visibility,
                  unlockPrice: post.unlockPrice,
                }}
              />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="border-white/10 bg-zinc-900/60 text-white">
            <CardHeader>
              <CardTitle className="text-base">Veröffentlichung</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-zinc-500">Sichtbarkeit</span>

                <VisibilityBadge visibility={post.visibility} />
              </div>

              {post.visibility === "PREMIUM" ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-500">Preis</span>

                  <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300">
                    <Coins className="size-4" />
                    {post.unlockPrice ?? 0} Credits
                  </span>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-zinc-500">Likes</span>

                <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                  <Heart className="size-4 text-rose-400" />
                  {post._count.likes}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-zinc-500">Status</span>

                <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                  {post.status === "PUBLISHED" ? "Veröffentlicht" : post.status}
                </Badge>
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="inline-flex items-center gap-2 text-xs text-zinc-500">
                  <CalendarDays className="size-3.5" />
                  Zuletzt geändert: {formatDate(post.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          {firstMedia ? (
            <Card className="border-white/10 bg-zinc-900/60 text-white">
              <CardHeader>
                <CardTitle className="text-base">Mediendetails</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-500">Typ</span>

                  <span className="inline-flex items-center gap-1.5 text-white">
                    {firstMedia.type === "VIDEO" ? <Video className="size-4" /> : <FileImage className="size-4" />}

                    {firstMedia.type === "VIDEO" ? "Video" : "Bild"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-500">Dateigröße</span>
                  <span className="text-white">{formatFileSize(firstMedia.size)}</span>
                </div>

                {firstMedia.width && firstMedia.height ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-zinc-500">Auflösung</span>
                    <span className="text-white">
                      {firstMedia.width} × {firstMedia.height}
                    </span>
                  </div>
                ) : null}

                {firstMedia.duration ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-zinc-500">Dauer</span>
                    <span className="text-white">{formatDuration(firstMedia.duration)}</span>
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-500">Format</span>
                  <span className="max-w-44 truncate text-white">{firstMedia.mimeType}</span>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
