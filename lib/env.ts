import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
});

const parsedEnv = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
});

if (!parsedEnv.success) {
  console.error(parsedEnv.error.flatten().fieldErrors);
  throw new Error("Ungültige Umgebungsvariablen");
}

export const env = parsedEnv.data;
