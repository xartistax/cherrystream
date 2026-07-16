import sharp from "sharp";

export type ImageMetadata = {
  width: number;
  height: number;
  orientation: number | null;
  format: string;
};

export async function readImageMetadata(source: Buffer): Promise<ImageMetadata> {
  if (source.byteLength === 0) {
    throw new Error("Das Bild ist leer.");
  }

  const metadata = await sharp(source, {
    failOn: "error",
    limitInputPixels: 50_000_000,
  }).metadata();

  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new Error("Die Bildmetadaten konnten nicht gelesen werden.");
  }

  const swapsDimensions = metadata.orientation !== undefined && metadata.orientation >= 5;

  return {
    width: swapsDimensions ? metadata.height : metadata.width,
    height: swapsDimensions ? metadata.width : metadata.height,
    orientation: metadata.orientation ?? null,
    format: metadata.format,
  };
}

export async function stripExifMetadata(source: Buffer): Promise<Buffer> {
  if (source.byteLength === 0) {
    throw new Error("Das Bild ist leer.");
  }

  return sharp(source, {
    failOn: "error",
    limitInputPixels: 50_000_000,
  })
    .autoOrient()
    .toBuffer();
}
