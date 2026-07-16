"use client";

import { useState } from "react";

import { MediaCard, type StudioMediaCardData } from "@/components/studio/media/media-card";
import { EmptyMedia } from "./empty-media";
import { MediaDetailsDialog } from "./media-details-dialog";

type MediaGridProps = {
  media: StudioMediaCardData[];
};

export function MediaGrid({ media }: MediaGridProps) {
  const [selectedMedia, setSelectedMedia] = useState<StudioMediaCardData | null>(null);

  if (media.length === 0) {
    return <EmptyMedia />;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {media.map((item) => (
          <MediaCard key={item.id} media={item} onSelect={setSelectedMedia} />
        ))}
      </div>

      <MediaDetailsDialog
        media={selectedMedia}
        open={selectedMedia !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMedia(null);
          }
        }}
      />
    </>
  );
}
