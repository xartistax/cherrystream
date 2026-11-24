import "server-only";

import { execa } from "execa";

/**
 * Resolution order: explicit env variable, bundled binary (ffmpeg-static / @ffprobe-installer), system binary.
 * Bundled binaries make video processing work on Vercel, where no system FFmpeg exists.
 */
async function resolveFfmpegPath(): Promise<string> {
  const configuredPath = process.env.FFMPEG_PATH?.trim();

  if (configuredPath) {
    return configuredPath;
  }

  const { default: bundledPath } = await import("ffmpeg-static");

  return bundledPath ?? "ffmpeg";
}

async function resolveFfprobePath(): Promise<string> {
  const configuredPath = process.env.FFPROBE_PATH?.trim();

  if (configuredPath) {
    return configuredPath;
  }

  try {
    const { path: bundledPath } = await import("@ffprobe-installer/ffprobe");

    return bundledPath;
  } catch {
    return "ffprobe";
  }
}

let binaries: Promise<{ ffmpegPath: string; ffprobePath: string }> | undefined;

export function getFfmpegBinaries() {
  binaries ??= Promise.all([resolveFfmpegPath(), resolveFfprobePath()]).then(([ffmpegPath, ffprobePath]) => ({
    ffmpegPath,
    ffprobePath,
  }));

  return binaries;
}

export async function assertFfmpegAvailable(): Promise<void> {
  const { ffmpegPath, ffprobePath } = await getFfmpegBinaries();

  try {
    await Promise.all([execa(ffmpegPath, ["-version"]), execa(ffprobePath, ["-version"])]);
  } catch {
    throw new Error("FFmpeg oder FFprobe wurde nicht gefunden. Prüfe FFMPEG_PATH und FFPROBE_PATH.");
  }
}
