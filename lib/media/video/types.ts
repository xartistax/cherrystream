export type VideoMetadata = {
  width: number;
  height: number;
  durationSeconds: number;
};

export type GeneratedVideoPoster = {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  mimeType: "image/webp";
  timestampSeconds: number;
};
