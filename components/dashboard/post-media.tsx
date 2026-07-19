import { Play } from "lucide-react";
import Image from "next/image";

import type { MediaType } from "@/generated/prisma/enums";

type PostMediaProps = {
  media: Array<{
    id: string;
    type: MediaType;
    url: string;
    feedUrl: string | null;
    fullUrl: string | null;
    posterUrl: string | null;
    duration: number | null;
    blurHash: string | null;
    width: number | null;
    height: number | null;
  }>;
};

function formatDuration(duration: number | null): string | null {
  if (!duration) {
    return null;
  }

  const totalSeconds = Math.round(duration);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function PostMedia({ media }: PostMediaProps) {
  if (media.length === 0) {
    return null;
  }

  return (
    <div
      className={
        media.length === 1
          ? "grid grid-cols-1 overflow-hidden border-y border-white/10 bg-black"
          : "grid grid-cols-2 gap-0.5 overflow-hidden border-y border-white/10 bg-black"
      }
    >
      {media.slice(0, 4).map((item, index) => {
        const imageUrl = item.feedUrl ?? item.url;
        const videoUrl = item.fullUrl ?? item.url;
        const duration = formatDuration(item.duration);

        return (
          <div key={item.id} className={media.length === 1 ? "relative aspect-video max-h-[720px] bg-black" : "relative aspect-square bg-black"}>
            {item.type === "IMAGE" ? (
              <Image
                src={imageUrl}
                alt=""
                fill
                sizes={media.length === 1 ? "(max-width: 768px) 100vw, 680px" : "(max-width: 768px) 50vw, 340px"}
                className="object-cover"
              />
            ) : (
              <div className="relative size-full">
                <video
                  src={videoUrl}
                  poster={item.posterUrl ?? item.feedUrl ?? undefined}
                  controls
                  playsInline
                  preload="metadata"
                  className="size-full bg-black object-contain"
                />

                <div className="pointer-events-none absolute left-3 top-3 flex size-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur">
                  <Play className="ml-0.5 size-4 fill-current" />
                </div>

                {duration ? (
                  <span className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur">
                    {duration}
                  </span>
                ) : null}
              </div>
            )}

            {index === 3 && media.length > 4 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-2xl font-bold text-white">+{media.length - 4}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
