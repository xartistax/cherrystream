/** Values of the Prisma enum Gender; kept as literals so client components can import this file. */
export type Gender = "WOMAN" | "MAN" | "TRANS" | "COUPLE" | "NON_BINARY" | "OTHER";

export const genderValues = ["WOMAN", "MAN", "TRANS", "COUPLE", "NON_BINARY", "OTHER"] as const satisfies readonly Gender[];

/** Choices in the listing forms (profile, onboarding, invites). */
export const genderOptions: Array<{ value: Gender; label: string }> = [
  { value: "WOMAN", label: "Frau" },
  { value: "MAN", label: "Mann" },
  { value: "TRANS", label: "Trans" },
  { value: "COUPLE", label: "Paar" },
  { value: "NON_BINARY", label: "Nicht-binär" },
  { value: "OTHER", label: "Andere" },
];

/** "Wen suchst du?" on /explore; the slug is the `gender` query parameter. */
export const genderFilters: Array<{ value: Gender; slug: string; label: string }> = [
  { value: "WOMAN", slug: "frauen", label: "Frauen" },
  { value: "MAN", slug: "maenner", label: "Männer" },
  { value: "TRANS", slug: "trans", label: "Trans" },
  { value: "COUPLE", slug: "paare", label: "Paare" },
];

export function parseGender(value: unknown): Gender | null {
  return typeof value === "string" && (genderValues as readonly string[]).includes(value) ? (value as Gender) : null;
}
