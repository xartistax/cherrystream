import "server-only";

import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { execa } from "execa";
import sharp from "sharp";

import { ffmpegPath } from "@/lib/media/video/ffmpeg";
import { readVideoMetadata } from "@/lib/media/video/metadata";
import type { GeneratedVideoPoster } from "@/lib/media/video/types";

const POSTER_WIDTH = 1080;
const POSTER_QUALITY = 84;

function getPosterTimestamp(durationSeconds: number): number {
  if (durationSeconds <= 1) {
    return 0;
  }

  return Math.min(Math.max(durationSeconds * 0.2, 0.5), durationSeconds - 0.25);
}

export async function generateVideoPoster(inputPath: string): Promise<GeneratedVideoPoster> {
  const metadata = await readVideoMetadata(inputPath);
  const timestampSeconds = getPosterTimestamp(metadata.durationSeconds);

  const temporaryFramePath = join(tmpdir(), `cherrystream-frame-${crypto.randomUUID()}.png`);

  try {
    await execa(ffmpegPath, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      timestampSeconds.toFixed(3),
      "-i",
      inputPath,
      "-frames:v",
      "1",
      "-an",
      "-sn",
      "-y",
      temporaryFramePath,
    ]);

    const frameBuffer = await readFile(temporaryFramePath);

    const { data, info } = await sharp(frameBuffer, {
      failOn: "error",
      limitInputPixels: 50_000_000,
    })
      .resize({
        width: POSTER_WIDTH,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: POSTER_QUALITY,
        effort: 5,
        smartSubsample: true,
      })
      .toBuffer({
        resolveWithObject: true,
      });

    if (!info.width || !info.height) {
      throw new Error("Das Video-Poster konnte nicht erzeugt werden.");
    }

    return {
      buffer: data,
      width: info.width,
      height: info.height,
      size: data.byteLength,
      mimeType: "image/webp",
      timestampSeconds,
    };
  } finally {
    await rm(temporaryFramePath, {
      force: true,
    });
  }
}
