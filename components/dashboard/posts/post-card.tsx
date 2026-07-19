import { Heart, Images, MessageCircle, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { VisibilityBadge } from "@/components/dashboard/posts/visibility-badge";
import { Badge } from "@/components/ui/badge";
import type { MediaType, PostVisibility } from "@/generated/prisma/enums";
import { PostMenu } from "./post-menu";

export type StudioPostCardData = {
  id: string;
  content: string | null;
  visibility: PostVisibility;
  unlockPrice: number | null;
  createdAt: Date;
  media: Array<{
    id: string;
    type: MediaType;
    url: string;
    feedUrl: string | null;
    posterUrl: string | null;
  }>;
  _count: {
    likes: number;
    comments?: number;
  };
};

type StudioPostCardProps = {
  post: StudioPostCardData;
  username: string;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("de-CH", {
    dateStyle: "medium",
  }).format(date);
}

export function StudioPostCard({ post, username }: StudioPostCardProps) {
  const firstMedia = post.media[0];

  const previewUrl = firstMedia?.type === "VIDEO" ? (firstMedia.posterUrl ?? firstMedia.feedUrl ?? firstMedia.url) : (firstMedia?.feedUrl ?? firstMedia?.url);

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 transition hover:border-white/20">
      <div className="relative aspect-square overflow-hidden bg-zinc-950">
        <Link href={`/dashboard/posts/${post.id}`} aria-label="Inhalt verwalten" className="absolute inset-0 z-0">
          <span className="sr-only">{post.content ?? "Veröffentlichung öffnen"}</span>
        </Link>

        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={post.content ?? "Veröffentlichung"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-zinc-700">
            <Images className="size-8" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/85 via-transparent to-black/10" />

        <div className="pointer-events-none absolute left-3 top-3">
          <VisibilityBadge visibility={post.visibility} />
        </div>

        <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
          {firstMedia?.type === "VIDEO" ? (
            <div className="pointer-events-none flex size-9 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur">
              <Play className="ml-0.5 size-4 fill-current" />
            </div>
          ) : null}

          {post.media.length > 1 ? (
            <Badge className="pointer-events-none gap-1 border-white/10 bg-black/65 text-white hover:bg-black/65">
              <Images className="size-3" />
              {post.media.length}
            </Badge>
          ) : null}

          <PostMenu postId={post.id} username={username} />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
          <p className="line-clamp-2 text-sm font-medium text-white">{post.content || "Ohne Beschreibung"}</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-zinc-500">{formatDate(post.createdAt)}</span>

          {post.visibility === "PREMIUM" && post.unlockPrice ? <span className="text-xs font-semibold text-amber-300">{post.unlockPrice} Credits</span> : null}
        </div>

        <div className="flex items-center gap-4 border-t border-white/10 pt-3 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="size-3.5" />
            {post._count.likes}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="size-3.5" />
            {post._count.comments ?? 0}
          </span>

          <Link href={`/dashboard/posts/${post.id}`} className="ml-auto font-medium text-rose-400 transition hover:text-rose-300">
            Verwalten
          </Link>
        </div>
      </div>
    </article>
  );
}
