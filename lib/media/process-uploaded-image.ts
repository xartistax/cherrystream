import "server-only";

import { del, put } from "@vercel/blob";

import { getBlobToken } from "@/lib/blob";
import { MAX_IMAGE_SIZE } from "@/lib/media";
import { processImage } from "@/lib/media/image";
import { UploadedMediaInput, PreparedPostMedia } from "./types";

type ProcessUploadedImageOptions = {
  media: UploadedMediaInput;
  userId: string;
};

type ProcessUploadedImageResult = {
  media: PreparedPostMedia;
  createdBlobUrls: string[];
};

async function downloadSourceImage(source: UploadedMediaInput): Promise<Buffer> {
  const response = await fetch(source.url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Die hochgeladene Bilddatei konnte nicht geladen werden.");
  }

  const contentType = response.headers.get("content-type");

  if (!contentType?.startsWith("image/")) {
    throw new Error("Die hochgeladene Datei ist kein gültiges Bild.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.byteLength === 0) {
    throw new Error("Die hochgeladene Bilddatei ist leer.");
  }

  if (buffer.byteLength > MAX_IMAGE_SIZE) {
    throw new Error("Das Bild überschreitet die erlaubte Dateigröße.");
  }

  return buffer;
}

export async function processUploadedImage({ media, userId }: ProcessUploadedImageOptions): Promise<ProcessUploadedImageResult> {
  if (media.type !== "IMAGE") {
    throw new Error("Die Datei ist kein Bild.");
  }

  const expectedPrefix = `posts/${userId}/`;

  if (!media.pathname.startsWith(expectedPrefix)) {
    throw new Error("Ungültiger Medienpfad.");
  }

  const sourceBuffer = await downloadSourceImage(media);
  const processed = await processImage(sourceBuffer);

  const mediaId = crypto.randomUUID();
  const basePath = `processed/posts/${userId}/${mediaId}`;
  const token = getBlobToken();

  const createdBlobUrls: string[] = [];

  try {
    const [originalBlob, profileBlob, feedBlob, fullBlob] = await Promise.all([
      put(`${basePath}/original.webp`, processed.original.buffer, {
        access: "public",
        token,
        contentType: "image/webp",
        addRandomSuffix: true,
        cacheControlMaxAge: 31_536_000,
      }),

      put(`${basePath}/profile.webp`, processed.variants.profile.buffer, {
        access: "public",
        token,
        contentType: "image/webp",
        addRandomSuffix: true,
        cacheControlMaxAge: 31_536_000,
      }),

      put(`${basePath}/studio.webp`, processed.variants.feed.buffer, {
        access: "public",
        token,
        contentType: "image/webp",
        addRandomSuffix: true,
        cacheControlMaxAge: 31_536_000,
      }),

      put(`${basePath}/full.webp`, processed.variants.full.buffer, {
        access: "public",
        token,
        contentType: "image/webp",
        addRandomSuffix: true,
        cacheControlMaxAge: 31_536_000,
      }),
    ]);

    createdBlobUrls.push(originalBlob.url, profileBlob.url, feedBlob.url, fullBlob.url);

    return {
      createdBlobUrls,
      media: {
        type: "IMAGE",
        status: "READY",

        url: feedBlob.url,
        pathname: feedBlob.pathname,
        mimeType: "image/webp",
        size: processed.variants.feed.size,

        originalUrl: originalBlob.url,
        originalPathname: originalBlob.pathname,

        profileUrl: profileBlob.url,
        profilePathname: profileBlob.pathname,

        feedUrl: feedBlob.url,
        feedPathname: feedBlob.pathname,

        fullUrl: fullBlob.url,
        fullPathname: fullBlob.pathname,

        blurHash: processed.blurHash,
        checksum: processed.checksum,

        width: processed.original.width,
        height: processed.original.height,

        posterUrl: null,
        posterPathname: null,
        duration: null,
      },
    };
  } catch (error) {
    if (createdBlobUrls.length > 0) {
      await del(createdBlobUrls, {
        token,
      }).catch((cleanupError: unknown) => {
        console.error("Processed image cleanup failed:", cleanupError);
      });
    }

    throw error;
  }
}
