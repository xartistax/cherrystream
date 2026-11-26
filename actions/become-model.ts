"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { PROFILE_DESCRIPTION_MAX_LENGTH, sanitizeProfileDescription } from "@/lib/sanitize-profile-description";
import { prisma } from "@/lib/prisma";
import { genderValues } from "@/lib/profile/gender";
import type { ActionState } from "@/types/action-state";

const modelProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Der Anzeigename muss mindestens 2 Zeichen haben.").max(50, "Der Anzeigename darf maximal 50 Zeichen haben."),
  bio: z.string(),
  gender: z.enum(genderValues, "Bitte wähle aus, als wer du inserierst."),
});

export async function saveModelProfileAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Du bist nicht angemeldet.",
    };
  }

  const parsedData = modelProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
    gender: formData.get("gender"),
  });

  if (!parsedData.success) {
    return {
      success: false,
      message: "Bitte überprüfe deine Eingaben.",
      errors: parsedData.error.flatten().fieldErrors,
    };
  }

  let sanitizedBio: string | null;

  try {
    sanitizedBio = sanitizeProfileDescription(parsedData.data.bio).html;
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "PROFILE_DESCRIPTION_TOO_LONG") {
      return {
        success: false,
        message: "Bitte überprüfe den Text deines Inserats.",
        errors: {
          bio: [`Der Text deines Inserats darf maximal ${PROFILE_DESCRIPTION_MAX_LENGTH.toLocaleString("de-CH")} Zeichen enthalten.`],
        },
      };
    }

    console.error("Model profile sanitization failed:", error);

    return {
      success: false,
      message: "Der Text deines Inserats konnte nicht verarbeitet werden.",
    };
  }

  try {
    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name: parsedData.data.displayName,
        profile: {
          upsert: {
            create: {
              displayName: parsedData.data.displayName,
              bio: sanitizedBio,
              gender: parsedData.data.gender,
            },
            update: {
              displayName: parsedData.data.displayName,
              bio: sanitizedBio,
              gender: parsedData.data.gender,
            },
          },
        },
      },
    });
  } catch (error: unknown) {
    console.error("Save model profile failed:", error);

    return {
      success: false,
      message: "Dein Inserat konnte nicht gespeichert werden.",
    };
  }

  redirect("/become-model/finish");
}
