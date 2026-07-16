import { encode } from "blurhash";
import sharp from "sharp";

const BLURHASH_WIDTH = 32;
const BLURHASH_HEIGHT = 32;
const COMPONENT_X = 4;
const COMPONENT_Y = 3;

export async function generateBlurHash(source: Buffer): Promise<string> {
  if (source.byteLength === 0) {
    throw new Error("Das Bild ist leer.");
  }

  const { data, info } = await sharp(source, {
    failOn: "error",
  })
    .rotate()
    .resize({
      width: BLURHASH_WIDTH,
      height: BLURHASH_HEIGHT,
      fit: "cover",
    })
    .ensureAlpha()
    .raw()
    .toBuffer({
      resolveWithObject: true,
    });

  if (info.width !== BLURHASH_WIDTH || info.height !== BLURHASH_HEIGHT || info.channels !== 4) {
    throw new Error("Das Bild konnte nicht für BlurHash vorbereitet werden.");
  }

  const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);

  return encode(pixels, info.width, info.height, COMPONENT_X, COMPONENT_Y);
}
