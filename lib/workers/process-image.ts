import sharp from "sharp";

export const IMAGE_VARIANTS = {
  profile: {
    width: 512,
    quality: 78,
  },
  feed: {
    width: 1080,
    quality: 82,
  },
  full: {
    width: 2048,
    quality: 86,
  },
} as const;

export type ImageVariantName = keyof typeof IMAGE_VARIANTS;

export type ResizedImage = {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  format: "webp";
  mimeType: "image/webp";
};

export type ResizedImageVariants = Record<ImageVariantName, ResizedImage>;

async function createVariant(source: Buffer, variant: ImageVariantName): Promise<ResizedImage> {
  const config = IMAGE_VARIANTS[variant];

  const { data, info } = await sharp(source, {
    failOn: "error",
    limitInputPixels: 50_000_000,
  })
    .rotate()
    .resize({
      width: config.width,
      height: config.width,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .webp({
      quality: config.quality,
      effort: 4,
      smartSubsample: true,
    })
    .toBuffer({
      resolveWithObject: true,
    });

  if (!info.width || !info.height) {
    throw new Error(`Bildgrösse für Variante "${variant}" konnte nicht ermittelt werden.`);
  }

  return {
    buffer: data,
    width: info.width,
    height: info.height,
    size: data.byteLength,
    format: "webp",
    mimeType: "image/webp",
  };
}

export async function resizeImageVariants(source: Buffer): Promise<ResizedImageVariants> {
  if (source.byteLength === 0) {
    throw new Error("Das Bild ist leer.");
  }

  const [profile, feed, full] = await Promise.all([createVariant(source, "profile"), createVariant(source, "feed"), createVariant(source, "full")]);

  return {
    profile,
    feed,
    full,
  };
}
