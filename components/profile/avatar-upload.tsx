"use client";

import { upload } from "@vercel/blob/client";
import { Camera, LoaderCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, useRef, useState, useTransition } from "react";

import { updateAvatarAction } from "@/actions/update-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, sanitizeFilename } from "@/lib/media";

type AvatarUploadProps = {
  user: {
    id: string;
    displayName: string;
    image: string | null;
  };
};

function getInitials(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Bitte wähle ein JPG-, PNG-, WebP- oder AVIF-Bild.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "Das Bild darf maximal 10 MB groß sein.";
  }

  return null;
}

export function AvatarUpload({ user }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState(user.image);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSelection(event: ChangeEvent<HTMLInputElement>) {
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
            target: "avatar",
          }),
        });

        const result = await updateAvatarAction({
          url: blob.url,
          pathname: blob.pathname,
        });

        if (!result.success || !result.imageUrl) {
          setError(result.message ?? "Der Avatar konnte nicht gespeichert werden.");
          return;
        }

        setImageUrl(result.imageUrl);
        setPreviewUrl(null);
      } catch (uploadError) {
        console.error("Avatar upload failed:", uploadError);
        setError("Der Avatar-Upload ist fehlgeschlagen.");
      } finally {
        URL.revokeObjectURL(localPreviewUrl);
      }
    });
  }

  const visibleImage = previewUrl ?? imageUrl;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative">
        <Avatar className="size-32 border-4 border-zinc-900 bg-zinc-900 shadow-2xl sm:size-40">
          {visibleImage ? (
            previewUrl ? (
              <div className="relative size-full">
                <Image src={previewUrl} alt={user.displayName} fill unoptimized className="object-cover" />
              </div>
            ) : (
              <AvatarImage src={visibleImage} alt={user.displayName} />
            )
          ) : null}

          <AvatarFallback className="bg-rose-500/15 text-2xl font-bold text-rose-300">{getInitials(user.displayName)}</AvatarFallback>
        </Avatar>

        {isPending ? (
          <div className="absolute inset-1 flex items-center justify-center rounded-full bg-black/70">
            <LoaderCircle className="size-7 animate-spin text-white" />
          </div>
        ) : null}
      </div>

      <div className="space-y-3 text-center sm:text-left">
        <div>
          <p className="font-semibold text-white">Profilbild</p>

          <p className="mt-1 text-sm text-zinc-500">JPG, PNG, WebP oder AVIF · maximal 10 MB</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <input ref={inputRef} type="file" accept={ALLOWED_IMAGE_TYPES.join(",")} disabled={isPending} className="hidden" onChange={handleSelection} />

          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
            Bild ändern
          </Button>

          {imageUrl ? (
            <Button type="button" variant="ghost" disabled className="text-zinc-500" title="Avatar löschen folgt im nächsten Schritt">
              <Trash2 className="size-4" />
              Entfernen
            </Button>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-sm text-rose-400">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
