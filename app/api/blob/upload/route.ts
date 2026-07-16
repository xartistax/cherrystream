import { createHash } from "node:crypto";

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } from "@/lib/media";

const clientPayloadSchema = z.object({
  kind: z.enum(["IMAGE", "VIDEO"]),
});

function getBlobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN fehlt.");
  }

  if (process.env.NODE_ENV === "development") {
    const fingerprint = createHash("sha256").update(token).digest("hex").slice(0, 12);

    console.log("Blob token fingerprint:", fingerprint);
  }

  return token;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody;

    const response = await handleUpload({
      body,
      request,
      token: getBlobToken(),

      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await auth();

        if (!session?.user?.id) {
          throw new Error("Nicht autorisiert.");
        }

        if (!pathname.startsWith(`posts/${session.user.id}/`)) {
          throw new Error("Ungültiger Upload-Pfad.");
        }

        let payload: unknown;

        try {
          payload = JSON.parse(clientPayload ?? "{}");
        } catch {
          throw new Error("Ungültige Upload-Daten.");
        }

        const parsedPayload = clientPayloadSchema.safeParse(payload);

        if (!parsedPayload.success) {
          throw new Error("Ungültige Upload-Daten.");
        }

        const isImage = parsedPayload.data.kind === "IMAGE";

        return {
          allowedContentTypes: isImage ? [...ALLOWED_IMAGE_TYPES] : [...ALLOWED_VIDEO_TYPES],
          maximumSizeInBytes: isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: session.user.id,
            kind: parsedPayload.data.kind,
          }),
        };
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Blob upload failed:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload fehlgeschlagen.",
      },
      {
        status: 400,
      },
    );
  }
}
