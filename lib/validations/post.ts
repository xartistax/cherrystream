import { z } from "zod";

import { MAX_POST_FILES } from "@/lib/media";

export const postMediaSchema = z.object({
  type: z.enum(["IMAGE", "VIDEO"]),
  url: z.string().url(),
  pathname: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
});
export const createPostSchema = z
  .object({
    content: z.string().trim().max(2000),
    visibility: z.enum(["PUBLIC", "FOLLOWERS", "PREMIUM"]),
    unlockPrice: z.number().int().positive().nullable(),
    media: z.array(postMediaSchema).min(1).max(MAX_POST_FILES),
  })
  .superRefine((data, context) => {
    if (data.visibility === "PREMIUM" && data.unlockPrice === null) {
      context.addIssue({
        code: "custom",
        path: ["unlockPrice"],
        message: "Lege einen Preis für den Premium-Beitrag fest.",
      });
    }

    if (data.visibility !== "PREMIUM" && data.unlockPrice !== null) {
      context.addIssue({
        code: "custom",
        path: ["unlockPrice"],
        message: "Ein Freischaltpreis ist nur für Premium-Beiträge erlaubt.",
      });
    }
  });

export type CreatePostInput = z.infer<typeof createPostSchema>;
