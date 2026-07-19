"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/types/action-state";

const schema = z.object({
  cantonId: z.string().min(1, "Bitte wähle einen Kanton."),
  cityId: z.string().min(1, "Bitte wähle eine Stadt."),
});

export async function saveModelLocationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Nicht angemeldet.",
    };
  }

  const parsed = schema.safeParse({
    cantonId: formData.get("cantonId"),
    cityId: formData.get("cityId"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Bitte überprüfe deine Eingaben.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const city = await prisma.city.findUnique({
    where: {
      id: parsed.data.cityId,
    },
    select: {
      cantonId: true,
    },
  });

  if (!city || city.cantonId !== parsed.data.cantonId) {
    return {
      success: false,
      message: "Die ausgewählte Stadt gehört nicht zum Kanton.",
    };
  }

  await prisma.profile.update({
    where: {
      userId: session.user.id,
    },
    data: {
      cantonId: parsed.data.cantonId,
      cityId: parsed.data.cityId,
    },
  });

  redirect("/become-model/categories");
}
