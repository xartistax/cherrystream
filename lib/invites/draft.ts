import "server-only";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/invites/token";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || null);

/** Shared by the admin form and the JSON import, so both create identical drafts. */
export const inviteDraftSchema = z
  .object({
    displayName: z.string().trim().min(2, "Der Name muss mindestens 2 Zeichen haben.").max(60),
    bio: optionalText(2_000),
    phoneNumber: optionalText(30),
    whatsappEnabled: z.boolean().default(false),
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

    return {
      ...draft,
      phoneNumber,
      whatsappEnabled: Boolean(phoneNumber) && draft.whatsappEnabled,
    };
  });

export type InviteDraft = z.output<typeof inviteDraftSchema>;

export type ResolvedLocation = {
  cantonId: string | null;
  cityId: string | null;
  categoryIds: string[];
};

/** Validates ids from the form, or resolves slugs from the import, against the database. */
export async function resolveInviteLocation(input: {
  cantonId?: string | null;
  cityId?: string | null;
  cantonSlug?: string | null;
  citySlug?: string | null;
  categoryIds?: string[];
  categorySlugs?: string[];
}): Promise<ResolvedLocation> {
  const canton = input.cantonId
    ? await prisma.canton.findUnique({ where: { id: input.cantonId }, select: { id: true } })
    : input.cantonSlug
      ? await prisma.canton.findUnique({ where: { slug: input.cantonSlug }, select: { id: true } })
      : null;

  const city =
    canton && (input.cityId || input.citySlug)
      ? await prisma.city.findFirst({
          where: {
            cantonId: canton.id,
            ...(input.cityId ? { id: input.cityId } : { slug: input.citySlug ?? "" }),
          },
          select: {
            id: true,
          },
        })
      : null;

  const categories =
    (input.categoryIds?.length ?? 0) > 0 || (input.categorySlugs?.length ?? 0) > 0
      ? await prisma.category.findMany({
          where: {
            isActive: true,
            OR: [{ id: { in: input.categoryIds ?? [] } }, { slug: { in: input.categorySlugs ?? [] } }],
          },
          select: {
            id: true,
          },
          take: 5,
        })
      : [];

  return {
    cantonId: canton?.id ?? null,
    cityId: city?.id ?? null,
    categoryIds: categories.map((category) => category.id),
  };
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
