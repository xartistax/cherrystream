"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/types/action-state";

const schema = z.object({
  categoryIds: z.array(z.string()).min(1, "Wähle mindestens eine Kategorie.").max(5, "Du kannst maximal 5 Kategorien auswählen."),
});

export async function saveModelCategoriesAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Du bist nicht angemeldet.",
    };
  }

  const categoryIds = Array.from(new Set(formData.getAll("categoryIds").filter((value): value is string => typeof value === "string" && value.length > 0)));

  const parsed = schema.safeParse({
    categoryIds,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Bitte wähle mindestens eine Kategorie.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const validCount = await prisma.category.count({
    where: {
      id: {
        in: parsed.data.categoryIds,
      },
      isActive: true,
    },
  });

  if (validCount !== parsed.data.categoryIds.length) {
    return {
      success: false,
      message: "Ungültige Kategorie.",
    };
  }

  await prisma.profile.update({
    where: {
      userId: session.user.id,
    },
    data: {
      categories: {
        deleteMany: {},
        create: parsed.data.categoryIds.map((categoryId) => ({
          category: {
            connect: {
              id: categoryId,
            },
          },
        })),
      },
    },
  });

  redirect("/become-model/finish");
}
