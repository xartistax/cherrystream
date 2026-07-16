import "server-only";

import { execa } from "execa";

function getBinary(environmentVariable: "FFMPEG_PATH" | "FFPROBE_PATH", fallback: string): string {
  return process.env[environmentVariable]?.trim() || fallback;
}

export const ffmpegPath = getBinary("FFMPEG_PATH", "ffmpeg");
export const ffprobePath = getBinary("FFPROBE_PATH", "ffprobe");

export async function assertFfmpegAvailable(): Promise<void> {
  try {
    await Promise.all([execa(ffmpegPath, ["-version"]), execa(ffprobePath, ["-version"])]);
  } catch {
    throw new Error("FFmpeg oder FFprobe wurde nicht gefunden. Prüfe FFMPEG_PATH und FFPROBE_PATH.");
  }
}
