"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCreatorAccess } from "@/lib/access";
import { paymentsEnabled } from "@/lib/features";
import { prisma } from "@/lib/prisma";

const updatePostSchema = z
  .object({
    postId: z.string().min(1),
    content: z.string().trim().max(2000),
    visibility: z.enum(["PUBLIC", "FOLLOWERS", "PREMIUM"]),
    unlockPrice: z.string().trim(),
  })
  .superRefine((data, context) => {
    if (data.visibility !== "PREMIUM") {
      return;
    }

    const unlockPrice = Number(data.unlockPrice);

    if (!Number.isInteger(unlockPrice) || unlockPrice < 1 || unlockPrice > 10_000) {
      context.addIssue({
        code: "custom",
        path: ["unlockPrice"],
        message: "Der Preis muss zwischen 1 und 10.000 Credits liegen.",
      });
    }
  });

export type UpdatePostState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function updatePostAction(_previousState: UpdatePostState, formData: FormData): Promise<UpdatePostState> {
  const access = await getCreatorAccess({ requireActive: true });

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  const parsedData = updatePostSchema.safeParse({
    postId: formData.get("postId"),
    content: formData.get("content"),
    visibility: formData.get("visibility"),
    unlockPrice: formData.get("unlockPrice") ?? "",
  });

  if (!parsedData.success) {
    return {
      success: false,
      message: "Bitte überprüfe deine Eingaben.",
      errors: parsedData.error.flatten().fieldErrors,
    };
  }

  const { postId, content, visibility, unlockPrice: rawUnlockPrice } = parsedData.data;

  try {
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        authorId: access.userId,
        status: {
          not: "DELETED",
        },
      },
      select: {
        id: true,
        visibility: true,
        author: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!post) {
      return {
        success: false,
        message: "Der Inhalt wurde nicht gefunden.",
      };
    }

    if (!paymentsEnabled && visibility === "PREMIUM" && post.visibility !== "PREMIUM") {
      return {
        success: false,
        message: "Premium-Inhalte sind noch nicht verfügbar.",
      };
    }

    const unlockPrice = visibility === "PREMIUM" ? Number(rawUnlockPrice) : null;

    await prisma.post.update({
      where: {
        id: post.id,
      },
      data: {
        content: content || null,
        visibility,
        unlockPrice,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/posts");
    revalidatePath(`/dashboard/posts/${post.id}`);
    revalidatePath(`/profile/${post.author.username}`);
    revalidatePath("/");

    return {
      success: true,
      message: "Die Veröffentlichung wurde gespeichert.",
    };
  } catch (error) {
    console.error("Update post failed:", error);

    return {
      success: false,
      message: "Die Veröffentlichung konnte nicht gespeichert werden.",
    };
  }
}
