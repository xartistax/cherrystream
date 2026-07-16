import "server-only";

import { processUploadedImage } from "@/lib/media/process-uploaded-image";
import type { PreparedPostMedia, UploadedMediaInput } from "@/lib/media/types";
import { processUploadedVideo } from "@/lib/media/video/process-uploaded-video";

type PreparePostMediaResult = {
  media: PreparedPostMedia[];
  rawImageUrls: string[];
  createdBlobUrls: string[];
};

export async function preparePostMedia(input: UploadedMediaInput[], userId: string): Promise<PreparePostMediaResult> {
  const preparedMedia: PreparedPostMedia[] = [];
  const rawImageUrls: string[] = [];
  const createdBlobUrls: string[] = [];

  try {
    for (const item of input) {
      if (item.type === "VIDEO") {
        const processed = await processUploadedVideo({
          media: item,
          userId,
        });

        preparedMedia.push(processed.media);
        createdBlobUrls.push(...processed.createdBlobUrls);

        continue;
      }

      const processed = await processUploadedImage({
        media: item,
        userId,
      });

      preparedMedia.push(processed.media);
      rawImageUrls.push(item.url);
      createdBlobUrls.push(...processed.createdBlobUrls);
    }

    return {
      media: preparedMedia,
      rawImageUrls,
      createdBlobUrls,
    };
  } catch (error) {
    const { del } = await import("@vercel/blob");
    const { getBlobToken } = await import("@/lib/blob");

    if (createdBlobUrls.length > 0) {
      await del(createdBlobUrls, {
        token: getBlobToken(),
      }).catch((cleanupError: unknown) => {
        console.error("Prepared media cleanup failed:", cleanupError);
      });
    }

    throw error;
  }
}
