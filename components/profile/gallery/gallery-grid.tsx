"use client";

import { LockKeyhole, Play } from "lucide-react";
import Image from "next/image";

import type { ProfileGalleryMedia } from "@/components/profile/gallery/profile-gallery";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type GalleryGridProps = {
  displayName: string;
  media: ProfileGalleryMedia[];
  onSelect: (index: number) => void;
};

export function GalleryGrid({ displayName, media, onSelect }: GalleryGridProps) {
  if (media.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
        <p className="text-sm text-zinc-500">Keine Inhalte in dieser Kategorie.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {media.map((item, index) => {
        const isPremium = item.visibility === "PREMIUM";

        const previewUrl = item.type === "VIDEO" ? (item.posterUrl ?? item.feedUrl ?? item.url) : (item.feedUrl ?? item.url);

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={isPremium ? `Premium-Inhalt von ${displayName} öffnen` : `Inhalt von ${displayName} öffnen`}
            className="group relative aspect-square min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 text-left transition hover:border-white/20"
          >
            <Image
              src={previewUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className={cn("object-cover transition duration-500 group-hover:scale-105", isPremium && "scale-105 blur-xl")}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 opacity-70 transition group-hover:opacity-100" />

            {item.type === "VIDEO" && !isPremium ? (
              <div className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur">
                <Play className="ml-0.5 size-4 fill-current" />
              </div>
            ) : null}

            {isPremium ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 px-4 text-center backdrop-blur-sm">
                <div className="flex size-12 items-center justify-center rounded-full border border-amber-400/20 bg-amber-500/15 text-amber-300">
                  <LockKeyhole className="size-5" />
                </div>

                <p className="mt-3 text-sm font-bold text-white">Premium-Inhalt</p>

                {item.unlockPrice ? (
                  <Badge className="mt-2 border border-amber-400/20 bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">{item.unlockPrice} Credits</Badge>
                ) : null}
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
