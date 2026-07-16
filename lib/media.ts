export const MAX_POST_FILES = 6;

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 250 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;

export type UploadMediaKind = "IMAGE" | "VIDEO";

export function getMediaKind(mimeType: string): UploadMediaKind | null {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "IMAGE";
  }

  if (ALLOWED_VIDEO_TYPES.includes(mimeType as (typeof ALLOWED_VIDEO_TYPES)[number])) {
    return "VIDEO";
  }

  return null;
}

export function sanitizeFilename(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "file";

  return `media.${extension.replace(/[^a-z0-9]/g, "")}`;
}
