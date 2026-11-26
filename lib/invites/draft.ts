import "server-only";

import { z } from "zod";

import { normalizePhoneNumber } from "@/lib/invites/token";
import { genderValues } from "@/lib/profile/gender";
import { prisma } from "@/lib/prisma";
import { PROFILE_DESCRIPTION_MAX_LENGTH, sanitizeProfileDescription } from "@/lib/sanitize-profile-description";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || null);

/** Shared by the create and the edit form, so both store identical drafts. */
export const inviteDraftSchema = z
  .object({
    displayName: z.string().trim().min(2, "Der Name muss mindestens 2 Zeichen haben.").max(60),
    gender: z.enum(genderValues).nullable(),
    // HTML from the editor; sanitized below.
    bio: optionalText(50_000),
    phoneNumber: optionalText(30),
    whatsappEnabled: z.boolean().default(false),
    signalNumber: optionalText(30),
    contactNote: optionalText(300),
    telegramUsername: optionalText(32).transform((value) => value?.replace(/^@/, "") ?? null),
    instagram: optionalText(30).transform((value) => value?.replace(/^@/, "") ?? null),
    website: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || null)
      .pipe(z.url("Die Website muss eine gültige URL sein.").nullable()),
    sourceNote: optionalText(300),
  })
  .transform((draft, context) => {
    const phoneNumber = draft.phoneNumber ? normalizePhoneNumber(draft.phoneNumber) : null;

    if (draft.phoneNumber && !phoneNumber) {
      context.addIssue({
        code: "custom",
        path: ["phoneNumber"],
        message: "Die Telefonnummer ist ungültig.",
      });

      return z.NEVER;
    }

    const signalNumber = draft.signalNumber ? normalizePhoneNumber(draft.signalNumber) : null;

    if (draft.signalNumber && !signalNumber) {
      context.addIssue({
        code: "custom",
        path: ["signalNumber"],
        message: "Die Signal-Nummer ist ungültig.",
      });

      return z.NEVER;
    }

    let bio: string | null;

    try {
      bio = inviteBioToHtml(draft.bio);
    } catch {
      context.addIssue({
        code: "custom",
        path: ["bio"],
        message: `Die Beschreibung darf maximal ${PROFILE_DESCRIPTION_MAX_LENGTH.toLocaleString("de-CH")} Zeichen enthalten.`,
      });

      return z.NEVER;
    }

    return {
      ...draft,
      bio,
      phoneNumber,
      signalNumber,
      whatsappEnabled: Boolean(phoneNumber) && draft.whatsappEnabled,
    };
  });

export type InviteDraft = z.output<typeof inviteDraftSchema>;

export type ResolvedLocation = {
  cantonId: string | null;
  cityId: string | null;
  categoryIds: string[];
  serviceIds: string[];
};

/** Validates the ids from the form against the database; unknown ids are dropped. */
export async function resolveInviteLocation(input: {
  cantonId: string | null;
  cityId: string | null;
  categoryIds: string[];
  serviceIds: string[];
}): Promise<ResolvedLocation> {
  const canton = input.cantonId ? await prisma.canton.findUnique({ where: { id: input.cantonId }, select: { id: true } }) : null;

  const [city, categories, services] = await Promise.all([
    canton && input.cityId ? prisma.city.findFirst({ where: { id: input.cityId, cantonId: canton.id }, select: { id: true } }) : null,
    input.categoryIds.length > 0
      ? prisma.category.findMany({ where: { id: { in: input.categoryIds }, isActive: true }, select: { id: true }, take: 5 })
      : [],
    input.serviceIds.length > 0 ? prisma.service.findMany({ where: { id: { in: input.serviceIds }, isActive: true }, select: { id: true } }) : [],
  ]);

  return {
    cantonId: canton?.id ?? null,
    cityId: city?.id ?? null,
    categoryIds: categories.map((category) => category.id),
    serviceIds: services.map((service) => service.id),
  };
}

/**
 * Sanitized HTML for a draft's description: HTML from the editor is cleaned, plain text (older drafts)
 * becomes paragraphs first. Throws PROFILE_DESCRIPTION_TOO_LONG like the profile form.
 */
export function inviteBioToHtml(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const looksLikeHtml = /<(p|br|strong|em|s|ul|ol|li|blockquote|h2|h3)\b/i.test(value);

  return sanitizeProfileDescription(looksLikeHtml ? value : plainTextToParagraphs(value)).html;
}

/** Turns the plain-text bio of a draft into the paragraph HTML the profile editor produces. */
export function plainTextToParagraphs(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const escaped = paragraph.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      return `<p>${escaped.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
}
