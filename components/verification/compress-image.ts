const MAX_DIMENSION = 2400;
const JPEG_QUALITY = 0.85;

/**
 * Downscales a phone photo in the browser so two images fit into one server action request
 * (Vercel limits request bodies to 4.5 MB). The server re-encodes it again anyway.
 */
export async function compressImage(file: File): Promise<File> {
  let bitmap: ImageBitmap;

  try {
    bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
  } catch {
    throw new Error("Dieses Bildformat wird nicht unterstützt. Bitte wähle ein JPG oder PNG.");
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("Das Bild konnte nicht verarbeitet werden.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });

  if (!blob) {
    throw new Error("Das Bild konnte nicht verarbeitet werden.");
  }

  return new File([blob], "verification.jpg", {
    type: "image/jpeg",
  });
}
