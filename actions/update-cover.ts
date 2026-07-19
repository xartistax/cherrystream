"use server";

import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getBlobToken } from "@/lib/blob";
import { MAX_IMAGE_SIZE } from "@/lib/media";
import { processImage } from "@/lib/media/image";
import { prisma } from "@/lib/prisma";

const uploadedCoverSchema = z.object({
  url: z.string().url(),
  pathname: z.string().min(1),
});

export type UpdateCoverResult = {
  success: boolean;
  coverUrl?: string;
  message?: string;
};

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Das hochgeladene Cover konnte nicht geladen werden.");
  }

  const contentType = response.headers.get("content-type");

  if (!contentType?.startsWith("image/")) {
    throw new Error("Die hochgeladene Datei ist kein Bild.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.byteLength === 0) {
    throw new Error("Das hochgeladene Cover ist leer.");
  }

  if (buffer.byteLength > MAX_IMAGE_SIZE) {
    throw new Error("Das Cover überschreitet die erlaubte Größe.");
  }

  return buffer;
}

export async function updateCoverAction(input: unknown): Promise<UpdateCoverResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Du bist nicht angemeldet.",
    };
  }

  const parsedInput = uploadedCoverSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      message: "Ungültige Upload-Daten.",
    };
  }

  const userId = session.user.id;
  const expectedPrefix = `profiles/${userId}/raw/`;

  if (!parsedInput.data.pathname.startsWith(expectedPrefix)) {
    return {
      success: false,
      message: "Ungültiger Upload-Pfad.",
    };
  }

  const token = getBlobToken();
  let processedUrl: string | null = null;

  try {
    const currentUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        username: true,
        profile: {
          select: {
            coverUrl: true,
          },
        },
      },
    });

    if (!currentUser) {
      return {
        success: false,
        message: "Benutzerkonto nicht gefunden.",
      };
    }

    const sourceBuffer = await downloadImage(parsedInput.data.url);
    const processedImage = await processImage(sourceBuffer);

    const coverBlob = await put(`profiles/${userId}/cover/cover.webp`, processedImage.variants.full.buffer, {
      access: "public",
      token,
      contentType: "image/webp",
      addRandomSuffix: true,
      cacheControlMaxAge: 31_536_000,
    });

    processedUrl = coverBlob.url;

    await prisma.profile.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        displayName: currentUser.username,
        coverUrl: coverBlob.url,
        coverPathname: coverBlob.pathname,
      },
      update: {
        coverUrl: coverBlob.url,
        coverPathname: coverBlob.pathname,
      },
    });

    const cleanupUrls = [parsedInput.data.url, currentUser.profile?.coverUrl].filter((url): url is string => typeof url === "string" && url !== coverBlob.url);

    if (cleanupUrls.length > 0) {
      await del(cleanupUrls, {
        token,
      }).catch((error: unknown) => {
        console.error("Cover cleanup failed:", error);
      });
    }

    revalidatePath("/profile");
    revalidatePath("/profile/edit");
    revalidatePath(`/profile/${currentUser.username}`);
    revalidatePath("/");
    revalidatePath("/explore");

    return {
      success: true,
      coverUrl: coverBlob.url,
    };
  } catch (error) {
    if (processedUrl) {
      await del(processedUrl, {
        token,
      }).catch(() => undefined);
    }

    console.error("Update cover failed:", error);

    return {
      success: false,
      message: error instanceof Error ? error.message : "Das Cover konnte nicht gespeichert werden.",
    };
  }
}
