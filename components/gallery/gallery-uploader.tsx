"use client";

import { ImagePlus, LoaderCircle, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type DragEvent, useRef, useState, useTransition } from "react";

import { uploadGalleryAction } from "@/actions/gallery-upload";
import { MediaPreview } from "@/components/gallery/media-preview";
import { UploadProgress } from "@/components/gallery/upload-progress";
import { useUpload } from "@/components/gallery/use-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paymentsEnabled } from "@/lib/features";
import { MAX_POST_FILES } from "@/lib/media";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime";

export function GalleryUploader({ userId }: { userId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [premium, setPremium] = useState(false);
  const [unlockPrice, setUnlockPrice] = useState("");
  const [isPending, startTransition] = useTransition();

  const { files, progress, error, setError, addFiles, removeFile, uploadFiles, reset } = useUpload({
    userId,
  });

  const isUploading = progress !== null && progress < 100;
  const isBusy = isPending || isUploading;
  const canAddMore = !isBusy && files.length < MAX_POST_FILES;

  async function handleSelection(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selected.length > 0) {
      await addFiles(selected);
    }
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (!canAddMore) {
      return;
    }

    const dropped = Array.from(event.dataTransfer.files);

    if (dropped.length > 0) {
      await addFiles(dropped);
    }
  }

  async function handleUpload() {
    const price = Number(unlockPrice);

    if (paymentsEnabled && premium && (!Number.isSafeInteger(price) || price <= 0)) {
      setError("Gib einen gültigen Preis in Credits ein.");
      return;
    }

    setError(null);

    try {
      const uploadedMedia = await uploadFiles();

      startTransition(async () => {
        const result = await uploadGalleryAction({
          media: uploadedMedia,
          premium: paymentsEnabled && premium,
          unlockPrice: paymentsEnabled && premium ? price : null,
        });

        if (!result.success) {
          setError(result.message ?? "Der Upload konnte nicht gespeichert werden.");
          return;
        }

        reset();
        setPremium(false);
        setUnlockPrice("");
        router.refresh();
      });
    } catch (uploadError) {
      console.error("Gallery upload failed:", uploadError);
      setError("Der Upload ist fehlgeschlagen.");
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 sm:p-5">
      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES} multiple disabled={!canAddMore} className="hidden" onChange={handleSelection} />

      <div
        role="button"
        tabIndex={canAddMore ? 0 : -1}
        aria-disabled={!canAddMore}
        onClick={() => canAddMore && inputRef.current?.click()}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && canAddMore) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition",
          isDragging ? "border-rose-400 bg-rose-500/10" : "border-white/15 bg-white/[0.02] hover:bg-white/[0.04]",
          canAddMore ? "cursor-pointer" : "cursor-not-allowed opacity-60",
        )}
      >
        <ImagePlus className="size-7 text-zinc-400" />

        <p className="font-medium text-white">Fotos & Videos auswählen</p>

        <p className="text-xs text-zinc-500">Oder hierher ziehen. Bis zu {MAX_POST_FILES} Dateien pro Upload, Fotos bis 10 MB, Videos bis 250 MB.</p>
      </div>

      <MediaPreview files={files} disabled={isBusy} onRemove={removeFile} />

      <UploadProgress progress={progress} />

      {paymentsEnabled && files.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-end gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={premium} disabled={isBusy} onChange={(event) => setPremium(event.target.checked)} className="size-4 accent-amber-500" />
            Als Premium anbieten
          </label>

          {premium ? (
            <div className="space-y-1">
              <Label htmlFor="unlock-price" className="text-xs text-zinc-400">
                Preis in Credits
              </Label>

              <Input
                id="unlock-price"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={unlockPrice}
                disabled={isBusy}
                onChange={(event) => setUnlockPrice(event.target.value)}
                className="h-9 w-32 border-white/10 bg-white/[0.03] text-white"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 text-sm text-rose-400">
          {error}
        </p>
      ) : null}

      {files.length > 0 ? (
        <div className="mt-4 flex justify-end">
          <Button type="button" disabled={isBusy} onClick={handleUpload} className="bg-rose-600 text-white hover:bg-rose-500">
            {isBusy ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {isBusy ? "Wird hochgeladen ..." : `${files.length} ${files.length === 1 ? "Datei" : "Dateien"} hochladen`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
