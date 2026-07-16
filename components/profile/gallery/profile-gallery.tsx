"use client";

import { Camera, Images, LockKeyhole, Video } from "lucide-react";
import { useState } from "react";

import { GalleryGrid } from "@/components/profile/gallery/gallery-grid";
import { MediaLightbox } from "@/components/profile/gallery/media-lightbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ProfileGalleryMedia = {
  id: string;
  postId: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  feedUrl: string | null;
  fullUrl: string | null;
  visibility: "PUBLIC" | "FOLLOWERS" | "PREMIUM";
  unlockPrice: number | null;
  posterUrl: string | null;
};

type ProfileGalleryProps = {
  displayName: string;
  media: ProfileGalleryMedia[];
};

export function ProfileGallery({ displayName, media }: ProfileGalleryProps) {
  const [lightboxMedia, setLightboxMedia] = useState<ProfileGalleryMedia[]>([]);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const photos = media.filter((item) => item.type === "IMAGE" && item.visibility !== "PREMIUM");

  const videos = media.filter((item) => item.type === "VIDEO" && item.visibility !== "PREMIUM");

  const premium = media.filter((item) => item.visibility === "PREMIUM");

  function openLightbox(items: ProfileGalleryMedia[], index: number) {
    setLightboxMedia(items);
    setLightboxIndex(index);
  }

  function closeLightbox() {
    setLightboxIndex(null);
  }

  return (
    <>
      <section className="mt-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Galerie</h2>

          <p className="mt-1 text-sm text-zinc-500">Fotos und Videos von {displayName}</p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6 inline-flex h-11 w-auto items-center justify-start gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
            <TabsTrigger value="all" className="gap-2 px-4">
              <Images className="size-4" />
              Alle
            </TabsTrigger>

            <TabsTrigger value="photos" className="gap-2 px-4">
              <Camera className="size-4" />
              Fotos
            </TabsTrigger>

            <TabsTrigger value="videos" className="gap-2 px-4">
              <Video className="size-4" />
              Videos
            </TabsTrigger>

            <TabsTrigger value="premium" className="gap-2 px-4">
              <LockKeyhole className="size-4" />
              Premium
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <GalleryGrid media={media} emptyMessage="Noch keine Medien veröffentlicht." onSelect={(index) => openLightbox(media, index)} />
          </TabsContent>

          <TabsContent value="photos" className="mt-0">
            <GalleryGrid media={photos} emptyMessage="Noch keine Fotos veröffentlicht." onSelect={(index) => openLightbox(photos, index)} />
          </TabsContent>

          <TabsContent value="videos" className="mt-0">
            <GalleryGrid media={videos} emptyMessage="Noch keine Videos veröffentlicht." onSelect={(index) => openLightbox(videos, index)} />
          </TabsContent>

          <TabsContent value="premium" className="mt-0">
            <GalleryGrid media={premium} emptyMessage="Noch keine Premium-Inhalte veröffentlicht." onSelect={(index) => openLightbox(premium, index)} />
          </TabsContent>
        </Tabs>
      </section>

      {lightboxIndex !== null && lightboxMedia.length > 0 ? (
        <MediaLightbox
          key={`${lightboxMedia[lightboxIndex]?.id}-${lightboxIndex}`}
          media={lightboxMedia}
          initialIndex={lightboxIndex}
          onClose={closeLightbox}
        />
      ) : null}
    </>
  );
}
