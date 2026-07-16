import "server-only";

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";

import { put } from "@vercel/blob";

import { getBlobToken } from "@/lib/blob";
import { MAX_VIDEO_SIZE } from "@/lib/media";
import { generateBlurHash } from "@/lib/media/blurhash";
import type { PreparedPostMedia, UploadedMediaInput } from "@/lib/media/types";
import { assertFfmpegAvailable } from "@/lib/media/video/ffmpeg";
import { readVideoMetadata } from "@/lib/media/video/metadata";
import { generateVideoPoster } from "@/lib/media/video/poster";

type ProcessUploadedVideoOptions = {
  media: UploadedMediaInput;
  userId: string;
};

type ProcessUploadedVideoResult = {
  media: PreparedPostMedia;
  createdBlobUrls: string[];
};

async function downloadVideo(source: UploadedMediaInput): Promise<Buffer> {
  const response = await fetch(source.url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Das hochgeladene Video konnte nicht geladen werden.");
  }

  const contentType = response.headers.get("content-type");

  if (!contentType?.startsWith("video/")) {
    throw new Error("Die hochgeladene Datei ist kein gültiges Video.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.byteLength === 0) {
    throw new Error("Das hochgeladene Video ist leer.");
  }

  if (buffer.byteLength > MAX_VIDEO_SIZE) {
    throw new Error("Das Video überschreitet die erlaubte Dateigröße.");
  }

  return buffer;
}

export async function processUploadedVideo({ media, userId }: ProcessUploadedVideoOptions): Promise<ProcessUploadedVideoResult> {
  if (media.type !== "VIDEO") {
    throw new Error("Die Datei ist kein Video.");
  }

  if (!media.pathname.startsWith(`posts/${userId}/`)) {
    throw new Error("Ungültiger Medienpfad.");
  }

  await assertFfmpegAvailable();

  const videoBuffer = await downloadVideo(media);
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "cherrystream-video-"));

  const extension = extname(media.pathname) || ".mp4";
  const inputPath = join(temporaryDirectory, `source${extension}`);

  try {
    await writeFile(inputPath, videoBuffer);

    const [metadata, poster] = await Promise.all([readVideoMetadata(inputPath), generateVideoPoster(inputPath)]);

    const blurHash = await generateBlurHash(poster.buffer);
    const token = getBlobToken();
    const mediaId = crypto.randomUUID();

    const posterBlob = await put(`processed/posts/${userId}/${mediaId}/poster.webp`, poster.buffer, {
      access: "public",
      token,
      contentType: poster.mimeType,
      addRandomSuffix: true,
      cacheControlMaxAge: 31_536_000,
    });

    return {
      createdBlobUrls: [posterBlob.url],

      media: {
        type: "VIDEO",
        status: "READY",

        url: media.url,
        pathname: media.pathname,
        mimeType: media.mimeType,
        size: media.size,

        originalUrl: media.url,
        originalPathname: media.pathname,

        profileUrl: posterBlob.url,
        profilePathname: posterBlob.pathname,

        feedUrl: posterBlob.url,
        feedPathname: posterBlob.pathname,

        fullUrl: media.url,
        fullPathname: media.pathname,

        posterUrl: posterBlob.url,
        posterPathname: posterBlob.pathname,
        duration: metadata.durationSeconds,

        blurHash,
        checksum: null,

        width: metadata.width,
        height: metadata.height,
      },
    };
  } finally {
    await rm(temporaryDirectory, {
      recursive: true,
      force: true,
    });
  }
}
