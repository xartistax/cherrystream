"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCreatorAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/types/action-state";
import { PROFILE_DESCRIPTION_MAX_LENGTH, sanitizeProfileDescription } from "@/lib/sanitize-profile-description";
const contactChannels = ["PHONE", "WHATSAPP", "TELEGRAM", "SIGNAL", "WEBSITE", "INSTAGRAM", "EMAIL"] as const;

type ContactChannel = (typeof contactChannels)[number];

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => value || null);

const optionalId = z
  .string()
  .trim()
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

const optionalPhoneNumber = z
  .string()
  .trim()
  .max(30, "Die Telefonnummer ist zu lang.")
  .refine((value) => !value || /^\+?[0-9\s()./-]{7,30}$/.test(value), "Bitte gib eine gültige Telefonnummer ein.")
  .transform((value) => value || null);

const optionalUsername = (maxLength: number, message: string) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => value.replace(/^@+/, ""))
    .refine((value) => !value || /^[a-zA-Z0-9._]+$/.test(value), message)
    .transform((value) => value || null);

const optionalEmail = z
  .string()
  .trim()
  .max(255, "Die E-Mail-Adresse ist zu lang.")
  .refine((value) => !value || z.string().email().safeParse(value).success, "Bitte gib eine gültige E-Mail-Adresse ein.")
  .transform((value) => value || null);

const profileSchema = z
  .object({
    displayName: z.string().trim().min(2, "Der Anzeigename muss mindestens 2 Zeichen haben.").max(50, "Der Anzeigename darf maximal 50 Zeichen haben."),

    bio: z.string().nullable(),

    birthDate: z
      .string()
      .trim()
      .refine((value) => !value || !Number.isNaN(Date.parse(value)), "Bitte gib ein gültiges Geburtsdatum ein."),

    gender: z.enum(["WOMAN", "MAN", "NON_BINARY", "OTHER"]).nullable(),

    isPublic: z.boolean(),

    categoryIds: z.array(z.string().min(1)).max(5, "Du kannst maximal 5 Kategorien auswählen."),

    cantonId: optionalId,
    cityId: optionalId,

    phoneNumber: optionalPhoneNumber,
    phoneEnabled: z.boolean(),
    whatsappEnabled: z.boolean(),

    telegramUsername: optionalUsername(32, "Der Telegram-Benutzername enthält ungültige Zeichen."),
    telegramEnabled: z.boolean(),

    signalNumber: optionalPhoneNumber,
    signalEnabled: z.boolean(),

    website: optionalUrl,
    websiteEnabled: z.boolean(),

    instagram: optionalUsername(30, "Der Instagram-Benutzername enthält ungültige Zeichen."),
    instagramEnabled: z.boolean(),

    emailPublic: optionalEmail,
    emailEnabled: z.boolean(),

    preferredContact: z.enum(contactChannels).nullable(),

    contactNote: optionalText(300),
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

    if ((data.phoneEnabled || data.whatsappEnabled) && !data.phoneNumber) {
      context.addIssue({
        code: "custom",
        path: ["phoneNumber"],
        message: "Hinterlege eine Telefonnummer für Telefon oder WhatsApp.",
      });
    }

    if (data.telegramEnabled && !data.telegramUsername) {
      context.addIssue({
        code: "custom",
        path: ["telegramUsername"],
        message: "Hinterlege einen Telegram-Benutzernamen.",
      });
    }

    if (data.signalEnabled && !data.signalNumber) {
      context.addIssue({
        code: "custom",
        path: ["signalNumber"],
        message: "Hinterlege eine Signal-Nummer.",
      });
    }

    if (data.websiteEnabled && !data.website) {
      context.addIssue({
        code: "custom",
        path: ["website"],
        message: "Hinterlege eine Website.",
      });
    }

    if (data.instagramEnabled && !data.instagram) {
      context.addIssue({
        code: "custom",
        path: ["instagram"],
        message: "Hinterlege einen Instagram-Benutzernamen.",
      });
    }

    if (data.emailEnabled && !data.emailPublic) {
      context.addIssue({
        code: "custom",
        path: ["emailPublic"],
        message: "Hinterlege eine öffentliche E-Mail-Adresse.",
      });
    }

    if (data.preferredContact) {
      const enabledChannels: Record<ContactChannel, boolean> = {
        PHONE: data.phoneEnabled,
        WHATSAPP: data.whatsappEnabled,
        TELEGRAM: data.telegramEnabled,
        SIGNAL: data.signalEnabled,
        WEBSITE: data.websiteEnabled,
        INSTAGRAM: data.instagramEnabled,
        EMAIL: data.emailEnabled,
      };

      if (!enabledChannels[data.preferredContact]) {
        context.addIssue({
          code: "custom",
          path: ["preferredContact"],
          message: "Der bevorzugte Kontaktkanal muss aktiviert sein.",
        });
      }
    }
  });

export async function updateProfileAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getCreatorAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  const rawGender = formData.get("gender");
  const rawPreferredContact = formData.get("preferredContact");

  const categoryIds = Array.from(
    new Set(formData.getAll("categoryIds").filter((value): value is string => typeof value === "string" && value.trim().length > 0)),
  );

  const parsedData = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
    birthDate: formData.get("birthDate"),
    gender: typeof rawGender === "string" && rawGender.length > 0 ? rawGender : null,

    isPublic: formData.get("isPublic") === "on",

    categoryIds,
    cantonId: formData.get("cantonId"),
    cityId: formData.get("cityId"),

    phoneNumber: formData.get("phoneNumber"),
    phoneEnabled: formData.get("phoneEnabled") === "on",
    whatsappEnabled: formData.get("whatsappEnabled") === "on",

    telegramUsername: formData.get("telegramUsername"),
    telegramEnabled: formData.get("telegramEnabled") === "on",

    signalNumber: formData.get("signalNumber"),
    signalEnabled: formData.get("signalEnabled") === "on",

    website: formData.get("website"),
    websiteEnabled: formData.get("websiteEnabled") === "on",

    instagram: formData.get("instagram"),
    instagramEnabled: formData.get("instagramEnabled") === "on",

    emailPublic: formData.get("emailPublic"),
    emailEnabled: formData.get("emailEnabled") === "on",

    preferredContact: typeof rawPreferredContact === "string" && rawPreferredContact.length > 0 ? rawPreferredContact : null,

    contactNote: formData.get("contactNote"),
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
        message: "Bitte überprüfe deine Profilbeschreibung.",
        errors: {
          bio: [`Die Profilbeschreibung darf maximal ${PROFILE_DESCRIPTION_MAX_LENGTH.toLocaleString("de-CH")} Zeichen enthalten.`],
        },
      };
    }

    console.error("Profile description sanitization failed:", error);

    return {
      success: false,
      message: "Die Profilbeschreibung konnte nicht verarbeitet werden.",
    };
  }

  const {
    displayName,
    birthDate,
    gender,
    isPublic,
    categoryIds: selectedCategoryIds,
    cantonId,
    cityId,

    phoneNumber,
    phoneEnabled,
    whatsappEnabled,

    telegramUsername,
    telegramEnabled,

    signalNumber,
    signalEnabled,

    website,
    websiteEnabled,

    instagram,
    instagramEnabled,

    emailPublic,
    emailEnabled,

    preferredContact,
    contactNote,
  } = parsedData.data;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: access.userId,
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

    const profileData = {
      displayName,
      bio: sanitizedBio,
      birthDate: birthDate ? new Date(`${birthDate}T00:00:00.000Z`) : null,
      gender,
      isPublic,
      cantonId,
      cityId,

      phoneNumber,
      phoneEnabled,
      whatsappEnabled,

      telegramUsername,
      telegramEnabled,

      signalNumber,
      signalEnabled,

      website,
      websiteEnabled,

      instagram,
      instagramEnabled,

      emailPublic,
      emailEnabled,

      preferredContact,
      contactNote,
    };

    await prisma.user.update({
      where: {
        id: access.userId,
      },
      data: {
        name: displayName,

        profile: {
          upsert: {
            create: {
              ...profileData,

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
              ...profileData,

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

    revalidatePath("/dashboard");
    revalidatePath("/profile/edit");
    revalidatePath(`/profile/${user.username}`);
    revalidatePath("/explore");
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
