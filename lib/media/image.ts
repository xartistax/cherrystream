import sharp from "sharp";

import { generateBlurHash } from "@/lib/media/blurhash";
import { sha256FromBuffer } from "@/lib/media/checksum";
import { readImageMetadata, stripExifMetadata } from "@/lib/media/exif";
import { generateImageVariants } from "@/lib/media/resize";
import type { ProcessedImage } from "@/lib/media/types";

async function createNormalizedOriginal(source: Buffer): Promise<ProcessedImage["original"]> {
  const sourceMetadata = await readImageMetadata(source);

  const { data, info } = await sharp(source, {
    failOn: "error",
    limitInputPixels: 50_000_000,
  })
    .autoOrient()
    .webp({
      quality: 92,
      effort: 6,
      smartSubsample: true,
    })
    .toBuffer({
      resolveWithObject: true,
    });

  if (!info.width || !info.height) {
    throw new Error("Die normalisierte Originaldatei konnte nicht erstellt werden.");
  }

  return {
    buffer: data,
    width: info.width,
    height: info.height,
    size: data.byteLength,
    sourceFormat: sourceMetadata.format,
    mimeType: "image/webp",
  };
}

export async function processImage(source: Buffer): Promise<ProcessedImage> {
  if (source.byteLength === 0) {
    throw new Error("Das Bild ist leer.");
  }

  const checksum = await sha256FromBuffer(source);
  const normalizedSource = await stripExifMetadata(source);

  const [original, variants] = await Promise.all([createNormalizedOriginal(normalizedSource), generateImageVariants(normalizedSource)]);

  const blurHash = await generateBlurHash(variants.feed.buffer);

  return {
    checksum,
    original,
    variants,
    blurHash,
  };
}
