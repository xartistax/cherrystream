import sharp from "sharp";

export const IMAGE_SIZES = {
  profile: 512,
  feed: 1080,
  full: 2048,
} as const;

export type ImageVariant = {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  mimeType: "image/webp";
};

export type ImageVariants = {
  profile: ImageVariant;
  feed: ImageVariant;
  full: ImageVariant;
};

async function resize(input: Buffer, width: number, quality: number): Promise<ImageVariant> {
  const { data, info } = await sharp(input)
    .rotate()
    .resize({
      width,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .webp({
      quality,
      effort: 6,
      smartSubsample: true,
    })
    .toBuffer({
      resolveWithObject: true,
    });

  if (!info.width || !info.height) {
    throw new Error("Bild konnte nicht verarbeitet werden.");
  }

  return {
    buffer: data,
    width: info.width,
    height: info.height,
    size: data.byteLength,
    mimeType: "image/webp",
  };
}

export async function generateImageVariants(input: Buffer): Promise<ImageVariants> {
  const [profile, feed, full] = await Promise.all([
    resize(input, IMAGE_SIZES.profile, 80),
    resize(input, IMAGE_SIZES.feed, 82),
    resize(input, IMAGE_SIZES.full, 88),
  ]);

  return {
    profile,
    feed,
    full,
  };
}
