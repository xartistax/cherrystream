"use client";

import { upload } from "@vercel/blob/client";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, useRef, useState, useTransition } from "react";

import { removeCoverAction } from "@/actions/remove-cover";
import { updateCoverAction } from "@/actions/update-cover";
import { Button } from "@/components/ui/button";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, sanitizeFilename } from "@/lib/media";

type CoverUploadProps = {
  user: {
    id: string;
    coverUrl: string | null;
  };
};

function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Bitte wähle ein JPG-, PNG-, WebP- oder AVIF-Bild.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "Das Titelbild darf maximal 10 MB gross sein.";
  }

  return null;
}

export function CoverUpload({ user }: CoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [coverUrl, setCoverUrl] = useState(user.coverUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleCover = previewUrl ?? coverUrl;

  function handleSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const validationError = validateImage(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);

    setPreviewUrl(localPreviewUrl);
    setError(null);

    startTransition(async () => {
      try {
        const pathname = ["profiles", user.id, "raw", crypto.randomUUID(), sanitizeFilename(file.name)].join("/");

        const blob = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/blob/profile",
          clientPayload: JSON.stringify({
            target: "cover",
          }),
        });

        const result = await updateCoverAction({
          url: blob.url,
          pathname: blob.pathname,
        });

        if (!result.success || !result.coverUrl) {
          setError(result.message ?? "Das Titelbild konnte nicht gespeichert werden.");
          return;
        }

        setCoverUrl(result.coverUrl);
        setPreviewUrl(null);
      } catch (uploadError) {
        console.error("Cover upload failed:", uploadError);
        setError("Das Titelbild konnte nicht hochgeladen werden.");
      } finally {
        URL.revokeObjectURL(localPreviewUrl);
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      setError(null);

      const result = await removeCoverAction();

      if (!result.success) {
        setError(result.message ?? "Das Titelbild konnte nicht entfernt werden.");
        return;
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(null);
      setCoverUrl(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="relative h-48 overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-rose-600 via-pink-600 to-fuchsia-700 sm:h-64">
        {visibleCover ? (
          <Image
            src={visibleCover}
            alt="Titelbild"
            fill
            unoptimized={Boolean(previewUrl)}
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        ) : (
          <>
            <div className="absolute left-1/4 top-0 size-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 size-72 rounded-full bg-black/20 blur-3xl" />
          </>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-black/10" />

        {isPending ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur">
              <LoaderCircle className="size-4 animate-spin" />
              Titelbild wird verarbeitet
            </div>
          </div>
        ) : null}

        <div className="absolute bottom-4 right-4 flex gap-2">
          <input ref={inputRef} type="file" accept={ALLOWED_IMAGE_TYPES.join(",")} disabled={isPending} className="hidden" onChange={handleSelection} />

          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
            className="bg-black/65 text-white backdrop-blur hover:bg-black/80"
          >
            <ImagePlus className="size-4" />
            {coverUrl ? "Titelbild ändern" : "Titelbild hochladen"}
          </Button>

          {coverUrl ? (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              disabled={isPending}
              onClick={handleRemove}
              aria-label="Titelbild entfernen"
              className="size-9 bg-rose-600/85 backdrop-blur hover:bg-rose-600"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-white">Titelbild</p>

        <p className="mt-1 text-xs text-zinc-500">Empfohlenes Seitenverhältnis 3:1 · maximal 10 MB</p>

        {error ? (
          <p role="alert" className="mt-2 text-sm text-rose-400">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
