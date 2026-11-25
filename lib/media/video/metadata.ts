import "server-only";

import { execa } from "execa";

import { getFfmpegBinaries } from "@/lib/media/video/ffmpeg";
import type { VideoMetadata } from "@/lib/media/video/types";

type ProbeOutput = {
  streams?: Array<{
    codec_type?: string;
    width?: number;
    height?: number;
    duration?: string;
  }>;
  format?: {
    duration?: string;
  };
};

export async function readVideoMetadata(inputPath: string): Promise<VideoMetadata> {
  const { ffprobePath } = await getFfmpegBinaries();
  const { stdout } = await execa(ffprobePath, ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", inputPath]);

  const parsed = JSON.parse(stdout) as ProbeOutput;

  const videoStream = parsed.streams?.find((stream) => stream.codec_type === "video");

  if (!videoStream?.width || !videoStream.height) {
    throw new Error("Das Video enthält keinen gültigen Video-Stream.");
  }

  const rawDuration = videoStream.duration ?? parsed.format?.duration;

  const durationSeconds = Number(rawDuration);

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("Die Videolänge konnte nicht ermittelt werden.");
  }

  return {
    width: videoStream.width,
    height: videoStream.height,
    durationSeconds,
  };
}
