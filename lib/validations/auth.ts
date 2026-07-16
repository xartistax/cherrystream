import { z } from "zod";

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(2, "Der Anzeigename muss mindestens 2 Zeichen haben.").max(50, "Der Anzeigename darf maximal 50 Zeichen haben."),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Der Benutzername muss mindestens 3 Zeichen haben.")
      .max(24, "Der Benutzername darf maximal 24 Zeichen haben.")
      .regex(/^[a-z0-9_]+$/, "Nur Kleinbuchstaben, Zahlen und Unterstriche sind erlaubt."),
    email: z.string().trim().toLowerCase().email("Bitte gib eine gültige E-Mail-Adresse ein."),
    password: z.string().min(8, "Das Passwort muss mindestens 8 Zeichen haben.").max(72, "Das Passwort darf maximal 72 Zeichen haben."),
    passwordConfirmation: z.string(),
    birthDate: z.string().date("Bitte gib ein gültiges Geburtsdatum ein."),
    termsAccepted: z.literal("on", {
      error: "Du musst die Nutzungsbedingungen akzeptieren.",
    }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Die Passwörter stimmen nicht überein.",
  })
  .refine(
    (data) => {
      const birthDate = new Date(`${data.birthDate}T00:00:00.000Z`);
      const minimumBirthDate = new Date();

      minimumBirthDate.setUTCFullYear(minimumBirthDate.getUTCFullYear() - 18);

      return birthDate <= minimumBirthDate;
    },
    {
      path: ["birthDate"],
      message: "Du musst mindestens 18 Jahre alt sein.",
    },
  );

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Bitte gib eine gültige E-Mail-Adresse ein."),
  password: z.string().min(1, "Bitte gib dein Passwort ein.").max(72),
});
