import { z } from "zod";

import { MAX_POST_FILES } from "@/lib/media";

export const postMediaSchema = z.object({
  type: z.enum(["IMAGE", "VIDEO"]),
  url: z.string().url(),
  pathname: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
});

/** One upload can contain several files; each becomes its own gallery item. Premium only applies while payments are enabled. */
export const galleryUploadSchema = z
  .object({
    media: z.array(postMediaSchema).min(1).max(MAX_POST_FILES),
    premium: z.boolean().default(false),
    unlockPrice: z.number().int().positive().max(10_000).nullable().default(null),
  })
  .superRefine((data, context) => {
    if (data.premium && data.unlockPrice === null) {
      context.addIssue({
        code: "custom",
        path: ["unlockPrice"],
        message: "Lege einen Preis für die Premium-Inhalte fest.",
      });
    }
  });

export type GalleryUploadInput = z.input<typeof galleryUploadSchema>;
