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
    media: z.array(postMediaSchema).min(1).max(MAX_POST_FILES),
  })
  .superRefine((data, context) => {
    if (data.media.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["media"],
        message: "Füge mindestens ein Bild oder Video hinzu.",
      });
    }
  });

export type CreatePostInput = z.infer<typeof createPostSchema>;
