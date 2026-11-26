"use client";

import { Camera, Images, LockKeyhole, Video } from "lucide-react";
import { useState } from "react";

import { GalleryGrid } from "@/components/profile/gallery/gallery-grid";
import { MediaLightbox } from "@/components/profile/gallery/media-lightbox";
import { ReportDialog } from "@/components/reports/report-button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { paymentsEnabled } from "@/lib/features";

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
  unlocked: boolean;
};

type ProfileGalleryProps = {
  displayName: string;
  username: string;
  media: ProfileGalleryMedia[];
  authenticated: boolean;
  loginUrl: string;
  canReport: boolean;
};

export function ProfileGallery({ displayName, username, media, authenticated, loginUrl, canReport }: ProfileGalleryProps) {
  const [lightboxMedia, setLightboxMedia] = useState<ProfileGalleryMedia[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);

  const photos = media.filter((item) => item.type === "IMAGE" && item.visibility !== "PREMIUM");

  const videos = media.filter((item) => item.type === "VIDEO" && item.visibility !== "PREMIUM");

  const premium = media.filter((item) => item.visibility === "PREMIUM");

  // Premium only exists while payments are enabled.
  const showPremium = paymentsEnabled && premium.length > 0;

  function openLightbox(items: ProfileGalleryMedia[], index: number): void {
    const selectedMedia = items[index];

    if (!selectedMedia) {
      return;
    }

    const isLocked = selectedMedia.visibility === "PREMIUM" && !selectedMedia.unlocked;

    if (isLocked) {
      return;
    }

    setLightboxMedia(items);
    setLightboxIndex(index);
  }

  function closeLightbox(): void {
    setLightboxIndex(null);
  }

  if (media.length === 0) {
    return (
      <section className="mt-10">
        <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-zinc-900/40 px-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
            <Images className="size-6" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-white">Noch keine Fotos oder Videos</h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">Sobald {displayName} Fotos oder Videos hochlädt, erscheinen sie hier.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <Tabs defaultValue="all">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Galerie</h2>

            <p className="mt-1 text-sm text-zinc-500">Fotos und Videos von {displayName}</p>
          </div>

          <TabsList variant="line" className="h-auto flex-wrap justify-start">
            <TabsTrigger value="all" className="gap-2 px-3 py-2">
              <Images className="size-4" />
              Alle
              <Badge className="ml-1 bg-white/10 text-zinc-300 hover:bg-white/10">{media.length}</Badge>
            </TabsTrigger>

            <TabsTrigger value="photos" className="gap-2 px-3 py-2">
              <Camera className="size-4" />
              Fotos
              <Badge className="ml-1 bg-white/10 text-zinc-300 hover:bg-white/10">{photos.length}</Badge>
            </TabsTrigger>

            <TabsTrigger value="videos" className="gap-2 px-3 py-2">
              <Video className="size-4" />
              Videos
              <Badge className="ml-1 bg-white/10 text-zinc-300 hover:bg-white/10">{videos.length}</Badge>
            </TabsTrigger>

            {showPremium ? (
              <TabsTrigger value="premium" className="gap-2 px-3 py-2">
                <LockKeyhole className="size-4" />
                Premium
                <Badge className="ml-1 border border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/10">{premium.length}</Badge>
              </TabsTrigger>
            ) : null}
          </TabsList>
        </div>

        <TabsContent value="all">
          <GalleryGrid
            displayName={displayName}
            media={media}
            onSelect={(index) => openLightbox(media, index)}
            authenticated={authenticated}
            loginUrl={loginUrl}
          />
        </TabsContent>

        <TabsContent value="photos">
          <GalleryGrid
            displayName={displayName}
            media={photos}
            onSelect={(index) => openLightbox(photos, index)}
            authenticated={authenticated}
            loginUrl={loginUrl}
          />
        </TabsContent>

        <TabsContent value="videos">
          <GalleryGrid
            displayName={displayName}
            media={videos}
            onSelect={(index) => openLightbox(videos, index)}
            authenticated={authenticated}
            loginUrl={loginUrl}
          />
        </TabsContent>

        {showPremium ? (
          <TabsContent value="premium">
            <GalleryGrid
              displayName={displayName}
              media={premium}
              onSelect={(index) => openLightbox(premium, index)}
              authenticated={authenticated}
              loginUrl={loginUrl}
            />
          </TabsContent>
        ) : null}
      </Tabs>

      {lightboxIndex !== null ? (
        <MediaLightbox
          media={lightboxMedia}
          initialIndex={lightboxIndex}
          onClose={closeLightbox}
          onReport={
            canReport
              ? (postId) => {
                  // The lightbox sits above dialogs, so it closes before the report dialog opens.
                  closeLightbox();
                  setReportPostId(postId);
                }
              : undefined
          }
        />
      ) : null}

      {reportPostId ? (
        <ReportDialog
          username={username}
          postId={reportPostId}
          open
          onOpenChange={(open) => {
            if (!open) {
              setReportPostId(null);
            }
          }}
        />
      ) : null}
    </section>
  );
}
