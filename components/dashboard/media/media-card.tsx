import { FileImage, Images, Play, Video } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import type { MediaType } from "@/generated/prisma/enums";

export type StudioMediaCardData = {
  id: string;
  type: MediaType;
  url: string;
  feedUrl: string | null;
  fullUrl: string | null;
  posterUrl: string | null;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  createdAt: Date;
  post: {
    id: string;
    content: string | null;
    mediaCount: number;
  };
};

type MediaCardProps = {
  media: StudioMediaCardData;
  onSelect?: (media: StudioMediaCardData) => void;
};

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

export function MediaCard({ media, onSelect }: MediaCardProps) {
  const previewUrl = media.type === "VIDEO" ? (media.posterUrl ?? media.feedUrl ?? media.url) : (media.feedUrl ?? media.url);

  const duration = formatDuration(media.duration);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(media)}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 text-left transition hover:-translate-y-0.5 hover:border-rose-500/30"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-950">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-zinc-700">
            {media.type === "VIDEO" ? <Video className="size-8" /> : <FileImage className="size-8" />}
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/10" />

        <Badge className="absolute left-3 top-3 gap-1.5 border-white/10 bg-black/65 text-white hover:bg-black/65">
          {media.type === "VIDEO" ? <Play className="size-3 fill-current" /> : <FileImage className="size-3" />}

          {media.type === "VIDEO" ? "Video" : "Foto"}
        </Badge>

        {media.post.mediaCount > 1 ? (
          <Badge className="absolute right-3 top-3 gap-1 border-white/10 bg-black/65 text-white hover:bg-black/65">
            <Images className="size-3" />
            {media.post.mediaCount}
          </Badge>
        ) : null}

        {duration ? (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur">{duration}</span>
        ) : null}
      </div>

      <div className="space-y-2 p-3">
        <p className="line-clamp-1 text-sm font-medium text-white">{media.post.content || "Ohne Beschreibung"}</p>

        <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
          <span>{media.width && media.height ? `${media.width} × ${media.height}` : media.mimeType}</span>

          <span>{formatFileSize(media.size)}</span>
        </div>
      </div>
    </button>
  );
}
