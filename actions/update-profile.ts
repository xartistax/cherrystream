"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/types/action-state";

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => value || null);

const optionalUrl = z
  .string()
  .trim()
  .max(255, "Die URL ist zu lang.")
  .refine((value) => {
    if (!value) {
      return true;
    }

    try {
      const url = new URL(value);

      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Bitte gib eine gültige URL ein.")
  .transform((value) => value || null);

const optionalId = z
  .string()
  .trim()
  .transform((value) => value || null);

const profileSchema = z
  .object({
    displayName: z.string().trim().min(2, "Der Anzeigename muss mindestens 2 Zeichen haben.").max(50, "Der Anzeigename darf maximal 50 Zeichen haben."),

    bio: optionalText(500),

    birthDate: z
      .string()
      .trim()
      .refine((value) => !value || !Number.isNaN(Date.parse(value)), "Bitte gib ein gültiges Geburtsdatum ein."),

    gender: z.enum(["WOMAN", "MAN", "NON_BINARY", "OTHER"]).nullable(),

    website: optionalUrl,

    instagram: z
      .string()
      .trim()
      .max(30, "Der Instagram-Name darf maximal 30 Zeichen haben.")
      .transform((value) => value.replace(/^@+/, ""))
      .refine((value) => !value || /^[a-zA-Z0-9._]+$/.test(value), "Der Instagram-Name enthält ungültige Zeichen.")
      .transform((value) => value || null),

    isPublic: z.boolean(),

    categoryIds: z.array(z.string().min(1)).max(5, "Du kannst maximal 5 Kategorien auswählen."),

    cantonId: optionalId,
    cityId: optionalId,
  })
  .superRefine((data, context) => {
    if (data.birthDate) {
      const birthDate = new Date(`${data.birthDate}T00:00:00.000Z`);

      if (!Number.isNaN(birthDate.getTime())) {
        const minimumBirthDate = new Date();

        minimumBirthDate.setUTCHours(0, 0, 0, 0);
        minimumBirthDate.setUTCFullYear(minimumBirthDate.getUTCFullYear() - 18);

        if (birthDate > minimumBirthDate) {
          context.addIssue({
            code: "custom",
            path: ["birthDate"],
            message: "Du musst mindestens 18 Jahre alt sein.",
          });
        }
      }
    }

    if (data.cityId && !data.cantonId) {
      context.addIssue({
        code: "custom",
        path: ["cantonId"],
        message: "Wähle zuerst einen Kanton aus.",
      });
    }
  });

export async function updateProfileAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Du bist nicht angemeldet.",
    };
  }

  const rawGender = formData.get("gender");

  const categoryIds = Array.from(
    new Set(formData.getAll("categoryIds").filter((value): value is string => typeof value === "string" && value.trim().length > 0)),
  );

  const parsedData = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
    birthDate: formData.get("birthDate"),
    gender: typeof rawGender === "string" && rawGender.length > 0 ? rawGender : null,
    website: formData.get("website"),
    instagram: formData.get("instagram"),
    isPublic: formData.get("isPublic") === "on",
    categoryIds,
    cantonId: formData.get("cantonId"),
    cityId: formData.get("cityId"),
  });

  if (!parsedData.success) {
    return {
      success: false,
      message: "Bitte überprüfe deine Eingaben.",
      errors: parsedData.error.flatten().fieldErrors,
    };
  }

  const { displayName, bio, birthDate, gender, website, instagram, isPublic, categoryIds: selectedCategoryIds, cantonId, cityId } = parsedData.data;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        username: true,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "Dein Benutzerkonto wurde nicht gefunden.",
      };
    }

    const [validCategoryCount, canton, city] = await Promise.all([
      prisma.category.count({
        where: {
          id: {
            in: selectedCategoryIds,
          },
          isActive: true,
        },
      }),

      cantonId
        ? prisma.canton.findUnique({
            where: {
              id: cantonId,
            },
            select: {
              id: true,
            },
          })
        : null,

      cityId
        ? prisma.city.findUnique({
            where: {
              id: cityId,
            },
            select: {
              id: true,
              cantonId: true,
            },
          })
        : null,
    ]);

    if (validCategoryCount !== selectedCategoryIds.length) {
      return {
        success: false,
        message: "Bitte überprüfe deine Kategorien.",
        errors: {
          categoryIds: ["Mindestens eine Kategorie ist ungültig."],
        },
      };
    }

    if (cantonId && !canton) {
      return {
        success: false,
        message: "Bitte überprüfe deinen Standort.",
        errors: {
          cantonId: ["Der ausgewählte Kanton ist ungültig."],
        },
      };
    }

    if (cityId && !city) {
      return {
        success: false,
        message: "Bitte überprüfe deinen Standort.",
        errors: {
          cityId: ["Die ausgewählte Stadt ist ungültig."],
        },
      };
    }

    if (city && cantonId && city.cantonId !== cantonId) {
      return {
        success: false,
        message: "Bitte überprüfe deinen Standort.",
        errors: {
          cityId: ["Die ausgewählte Stadt gehört nicht zu diesem Kanton."],
        },
      };
    }

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name: displayName,

        profile: {
          upsert: {
            create: {
              displayName,
              bio,
              birthDate: birthDate ? new Date(`${birthDate}T00:00:00.000Z`) : null,
              gender,
              website,
              instagram,
              isPublic,
              cantonId,
              cityId,

              categories: {
                create: selectedCategoryIds.map((categoryId) => ({
                  category: {
                    connect: {
                      id: categoryId,
                    },
                  },
                })),
              },
            },

            update: {
              displayName,
              bio,
              birthDate: birthDate ? new Date(`${birthDate}T00:00:00.000Z`) : null,
              gender,
              website,
              instagram,
              isPublic,
              cantonId,
              cityId,

              categories: {
                deleteMany: {},
                create: selectedCategoryIds.map((categoryId) => ({
                  category: {
                    connect: {
                      id: categoryId,
                    },
                  },
                })),
              },
            },
          },
        },
      },
    });

    revalidatePath("/studio");
    revalidatePath("/profile/edit");
    revalidatePath(`/profile/${user.username}`);
    revalidatePath("/creators");
    revalidatePath("/");

    return {
      success: true,
      message: "Dein Profil wurde erfolgreich gespeichert.",
    };
  } catch (error) {
    console.error("Update profile failed:", error);

    return {
      success: false,
      message: "Dein Profil konnte nicht gespeichert werden.",
    };
  }
}
