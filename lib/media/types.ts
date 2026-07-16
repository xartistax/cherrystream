import type { ImageVariants } from "@/lib/media/resize";

export type ProcessedImage = {
  checksum: string;
  blurHash: string;

  original: {
    buffer: Buffer;
    width: number;
    height: number;
    size: number;
    sourceFormat: string;
    mimeType: "image/webp";
  };

  variants: ImageVariants;
};

export type UploadedMediaInput = {
  type: "IMAGE" | "VIDEO";
  url: string;
  pathname: string;
  mimeType: string;
  size: number;
};

export type PreparedPostMedia = {
  type: "IMAGE" | "VIDEO";
  status: "READY";

  url: string;
  pathname: string;
  mimeType: string;
  size: number;

  posterUrl: string | null;
  posterPathname: string | null;
  duration: number | null;

  originalUrl: string | null;
  originalPathname: string | null;

  profileUrl: string | null;
  profilePathname: string | null;

  feedUrl: string | null;
  feedPathname: string | null;

  fullUrl: string | null;
  fullPathname: string | null;

  blurHash: string | null;
  checksum: string | null;

  width: number | null;
  height: number | null;
};
