"use client";

import { Play, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import type { UploadMediaKind } from "@/lib/media";

export type SelectedMediaFile = {
  id: string;
  file: File;
  previewUrl: string;
  thumbnailUrl: string | null;
  type: UploadMediaKind;
};

type MediaPreviewProps = {
  files: SelectedMediaFile[];
  disabled: boolean;
  onRemove: (id: string) => void;
};

export function MediaPreview({ files, disabled, onRemove }: MediaPreviewProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {files.map((selectedFile) => (
        <div key={selectedFile.id} className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-800">
          {selectedFile.type === "IMAGE" ? (
            <Image src={selectedFile.previewUrl} alt={selectedFile.file.name} fill unoptimized className="object-cover" />
          ) : selectedFile.thumbnailUrl ? (
            <>
              <Image src={selectedFile.thumbnailUrl} alt={`Vorschau von ${selectedFile.file.name}`} fill unoptimized className="object-cover" />

              <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                <div className="flex size-11 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur">
                  <Play className="ml-0.5 size-5 fill-current" />
                </div>
              </div>
            </>
          ) : (
            <video src={selectedFile.previewUrl} className="size-full object-cover" muted playsInline preload="metadata" />
          )}

          <Button
            type="button"
            variant="secondary"
            size="icon"
            disabled={disabled}
            onClick={() => onRemove(selectedFile.id)}
            className="absolute right-2 top-2 size-8 rounded-full bg-black/70 text-white hover:bg-black"
            aria-label={`${selectedFile.file.name} entfernen`}
          >
            <X className="size-4" />
          </Button>

          <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
            {selectedFile.type === "IMAGE" ? "FOTO" : "VIDEO"}
          </span>
        </div>
      ))}
    </div>
  );
}
