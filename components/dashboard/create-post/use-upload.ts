"use client";

import { upload } from "@vercel/blob/client";
import { useState } from "react";

import { getMediaKind, MAX_IMAGE_SIZE, MAX_POST_FILES, MAX_VIDEO_SIZE, sanitizeFilename } from "@/lib/media";
import type { CreatePostInput } from "@/lib/validations/post";
import type { SelectedMediaFile } from "./media-preview";
import { createVideoThumbnail } from "./create-video-thumbnail";

export type UploadedMedia = CreatePostInput["media"][number];

type UseUploadOptions = {
  userId: string;
};

export function useUpload({ userId }: UseUploadOptions) {
  const [files, setFiles] = useState<SelectedMediaFile[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validateFile(file: File): string | null {
    const kind = getMediaKind(file.type);

    if (!kind) {
      return `${file.name}: Dateityp wird nicht unterstützt.`;
    }

    if (kind === "IMAGE" && file.size > MAX_IMAGE_SIZE) {
      return `${file.name}: Maximal 10 MB.`;
    }

    if (kind === "VIDEO" && file.size > MAX_VIDEO_SIZE) {
      return `${file.name}: Maximal 250 MB.`;
    }

    return null;
  }

  async function addFiles(selected: File[]): Promise<void> {
    if (files.length + selected.length > MAX_POST_FILES) {
      setError(`Maximal ${MAX_POST_FILES} Dateien erlaubt.`);
      return;
    }

    const next: SelectedMediaFile[] = [];

    try {
      for (const file of selected) {
        const validation = validateFile(file);
        const type = getMediaKind(file.type);

        if (validation || !type) {
          throw new Error(validation ?? `${file.name}: Dateityp wird nicht unterstützt.`);
        }

        const previewUrl = URL.createObjectURL(file);

        const thumbnailUrl = type === "VIDEO" ? await createVideoThumbnail(file) : null;

        next.push({
          id: crypto.randomUUID(),
          file,
          previewUrl,
          thumbnailUrl,
          type,
        });
      }

      setError(null);
      setFiles((current) => [...current, ...next]);
    } catch (error) {
      next.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);

        if (item.thumbnailUrl) {
          URL.revokeObjectURL(item.thumbnailUrl);
        }
      });

      setError(error instanceof Error ? error.message : "Die Vorschau konnte nicht erstellt werden.");
    }
  }

  function removeFile(id: string) {
    setFiles((current) => {
      const target = current.find((item) => item.id === id);

      if (target) {
        URL.revokeObjectURL(target.previewUrl);

        if (target.thumbnailUrl) {
          URL.revokeObjectURL(target.thumbnailUrl);
        }
      }

      return current.filter((item) => item.id !== id);
    });
  }

  async function uploadFiles(): Promise<UploadedMedia[]> {
    if (files.length === 0) {
      return [];
    }

    setProgress(0);

    const uploaded: UploadedMedia[] = [];

    for (const [index, item] of files.entries()) {
      const pathname = ["posts", userId, crypto.randomUUID(), sanitizeFilename(item.file.name)].join("/");

      const blob = await upload(pathname, item.file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
        clientPayload: JSON.stringify({
          kind: item.type,
        }),
      });

      uploaded.push({
        type: item.type,
        url: blob.url,
        pathname: blob.pathname,
        mimeType: item.file.type,
        size: item.file.size,
      });

      setProgress(Math.round(((index + 1) / files.length) * 100));
    }

    return uploaded;
  }

  function reset() {
    files.forEach((file) => {
      URL.revokeObjectURL(file.previewUrl);

      if (file.thumbnailUrl) {
        URL.revokeObjectURL(file.thumbnailUrl);
      }
    });

    setFiles([]);
    setProgress(null);
    setError(null);
  }

  return {
    files,
    progress,
    error,
    setError,
    addFiles,
    removeFile,
    uploadFiles,
    reset,
  };
}
