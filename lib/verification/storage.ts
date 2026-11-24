import "server-only";

import { del, get, put } from "@vercel/blob";
import sharp from "sharp";

import { ALLOWED_IMAGE_TYPES } from "@/lib/media";

export const MAX_VERIFICATION_IMAGE_SIZE = 3 * 1024 * 1024;

const MIN_DIMENSION = 600;
const MAX_DIMENSION = 2400;

export type VerificationImageKind = "id-document" | "selfie";

/** Errors with a message that is safe to show to the model. */
export class VerificationImageError extends Error {}

/**
 * Verification documents must live in a private Blob store.
 * VERIFICATION_BLOB_READ_WRITE_TOKEN allows a separate private store; it falls back to the default token.
 */
export function getVerificationBlobToken(): string {
  const token = process.env.VERIFICATION_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error("VERIFICATION_BLOB_READ_WRITE_TOKEN fehlt.");
  }

  return token;
}

export function getVerificationPathPrefix(userId: string): string {
  return `verifications/${userId}/`;
}

/**
 * Re-encodes the image as JPEG, which also strips EXIF metadata such as GPS coordinates,
 * and stores it privately. Returns the blob pathname.
 */
export async function storeVerificationImage(userId: string, kind: VerificationImageKind, file: File): Promise<string> {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new VerificationImageError("Bitte lade ein JPG-, PNG- oder WebP-Bild hoch.");
  }

  if (file.size === 0 || file.size > MAX_VERIFICATION_IMAGE_SIZE) {
    throw new VerificationImageError("Das Bild ist leer oder zu groß.");
  }

  const input = Buffer.from(await file.arrayBuffer());

  let output: Buffer;
  let width: number;
  let height: number;

  try {
    const result = await sharp(input, {
      failOn: "error",
      limitInputPixels: 50_000_000,
    })
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 88,
        mozjpeg: true,
      })
      .toBuffer({
        resolveWithObject: true,
      });

    output = result.data;
    width = result.info.width;
    height = result.info.height;
  } catch {
    throw new VerificationImageError("Das Bild konnte nicht gelesen werden.");
  }

  if (Math.max(width, height) < MIN_DIMENSION) {
    throw new VerificationImageError("Das Bild ist zu klein. Bitte lade ein schärferes Foto hoch.");
  }

  const blob = await put(`${getVerificationPathPrefix(userId)}${kind}.jpg`, output, {
    access: "private",
    token: getVerificationBlobToken(),
    contentType: "image/jpeg",
    addRandomSuffix: true,
  });

  return blob.pathname;
}

export async function readVerificationImage(pathname: string) {
  return get(pathname, {
    access: "private",
    token: getVerificationBlobToken(),
    useCache: false,
  });
}

export async function deleteVerificationImages(pathnames: Array<string | null>): Promise<void> {
  const existing = pathnames.filter((pathname): pathname is string => Boolean(pathname));

  if (existing.length === 0) {
    return;
  }

  await del(existing, {
    token: getVerificationBlobToken(),
  });
}
