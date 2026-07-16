"use client";

import { LockKeyhole, Play } from "lucide-react";
import Image from "next/image";

import type { ProfileGalleryMedia } from "@/components/profile/gallery/profile-gallery";

type GalleryGridProps = {
  media: ProfileGalleryMedia[];
  emptyMessage: string;
  onSelect: (index: number) => void;
};

export function GalleryGrid({ media, emptyMessage, onSelect }: GalleryGridProps) {
  if (media.length === 0) {
    return <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center text-zinc-500">{emptyMessage}</div>;
  }

  return (
    <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {media.map((item, index) => {
        const previewUrl = item.feedUrl ?? item.url;

        const isPremium = item.visibility === "PREMIUM";

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(index)}
            className="group relative aspect-square min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 text-left"
          >
            {item.type === "IMAGE" ? (
              <Image
                src={previewUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            ) : item.posterUrl ? (
              <Image
                src={item.posterUrl}
                alt="Video-Vorschau"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <video src={item.url} muted playsInline preload="metadata" className="size-full object-cover" />
            )}

            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-70 transition group-hover:opacity-100" />

            {item.type === "VIDEO" && (
              <div className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur">
                <Play className="size-4 fill-current" />
              </div>
            )}

            {isPremium && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-sm">
                <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
                  <LockKeyhole className="size-5" />
                </div>

                <p className="mt-3 text-sm font-semibold text-white">Premium</p>

                {item.unlockPrice ? <p className="mt-1 text-xs text-amber-300">{item.unlockPrice} Credits</p> : null}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
