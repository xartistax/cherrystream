"use client";

import { ChevronLeft, ChevronRight, LockKeyhole, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ProfileGalleryMedia } from "@/components/profile/gallery/profile-gallery";

type MediaLightboxProps = {
  media: ProfileGalleryMedia[];
  initialIndex: number;
  onClose: () => void;
};

export function MediaLightbox({ media, initialIndex, onClose }: MediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const currentItem = media[currentIndex];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft") {
        setCurrentIndex((current) => (current === 0 ? media.length - 1 : current - 1));
      }

      if (event.key === "ArrowRight") {
        setCurrentIndex((current) => (current === media.length - 1 ? 0 : current + 1));
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [media.length, onClose]);

  if (!currentItem) {
    return null;
  }

  const isPremium = currentItem.visibility === "PREMIUM";

  const source = currentItem.fullUrl ?? currentItem.feedUrl ?? currentItem.url;

  function showPrevious() {
    setCurrentIndex((current) => (current === 0 ? media.length - 1 : current - 1));
  }

  function showNext() {
    setCurrentIndex((current) => (current === media.length - 1 ? 0 : current + 1));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Medienansicht"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClose}
        aria-label="Lightbox schließen"
        className="absolute right-4 top-4 z-20 size-11 rounded-full bg-black/50 text-white hover:bg-white/10"
      >
        <X className="size-5" />
      </Button>

      {media.length > 1 ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={showPrevious}
            aria-label="Vorheriges Medium"
            className="absolute left-3 top-1/2 z-20 size-12 -translate-y-1/2 rounded-full bg-black/55 text-white hover:bg-white/10 sm:left-6"
          >
            <ChevronLeft className="size-6" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={showNext}
            aria-label="Nächstes Medium"
            className="absolute right-3 top-1/2 z-20 size-12 -translate-y-1/2 rounded-full bg-black/55 text-white hover:bg-white/10 sm:right-6"
          >
            <ChevronRight className="size-6" />
          </Button>
        </>
      ) : null}

      <div className="relative flex h-full w-full max-w-6xl items-center justify-center">
        {isPremium ? (
          <div className="flex max-w-sm flex-col items-center rounded-3xl border border-amber-500/20 bg-zinc-950/90 px-8 py-12 text-center shadow-2xl">
            <div className="flex size-16 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
              <LockKeyhole className="size-7" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-white">Premium-Inhalt</h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">Dieser Inhalt muss zuerst freigeschaltet werden.</p>

            {currentItem.unlockPrice ? <p className="mt-5 text-sm font-semibold text-amber-300">{currentItem.unlockPrice} Credits</p> : null}
          </div>
        ) : currentItem.type === "IMAGE" ? (
          <div className="relative h-full w-full">
            <Image src={source} alt="" fill priority sizes="100vw" className="object-contain" />
          </div>
        ) : (
          <video src={source} controls autoPlay playsInline preload="metadata" className="max-h-full max-w-full rounded-2xl bg-black" />
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-xs text-zinc-300 backdrop-blur">
        {currentIndex + 1} / {media.length}
      </div>
    </div>
  );
}
