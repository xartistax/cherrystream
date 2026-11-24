import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCreatorAccess } from "@/lib/access";
import { getBlobToken } from "@/lib/blob";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/lib/media";

const payloadSchema = z.object({
  target: z.enum(["avatar", "cover"]),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody;

    const response = await handleUpload({
      body,
      request,
      token: getBlobToken(),

      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const currentAccess = await getCreatorAccess();

        if (!currentAccess.allowed) {
          throw new Error(currentAccess.message);
        }

        let payload: unknown;

        try {
          payload = JSON.parse(clientPayload ?? "{}");
        } catch {
          throw new Error("Ungültige Upload-Daten.");
        }

        const parsedPayload = payloadSchema.safeParse(payload);

        if (!parsedPayload.success) {
          throw new Error("Ungültige Upload-Daten.");
        }

        const expectedPrefix = `profiles/${currentAccess.userId}/raw/`;

        if (!pathname.startsWith(expectedPrefix)) {
          throw new Error("Ungültiger Upload-Pfad.");
        }

        return {
          allowedContentTypes: [...ALLOWED_IMAGE_TYPES],
          maximumSizeInBytes: MAX_IMAGE_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: currentAccess.userId,
            target: parsedPayload.data.target,
          }),
        };
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Profile upload token failed:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload konnte nicht gestartet werden.",
      },
      { status: 400 },
    );
  }
}
