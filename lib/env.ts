import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  BLOB_READ_WRITE_TOKEN: z.string().min(1),

  NEXT_PUBLIC_APP_URL: z.url().optional(),

  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),

  FFMPEG_PATH: z.string().min(1).optional(),
  FFPROBE_PATH: z.string().min(1).optional(),
});

const parsedEnv = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,

  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || undefined,

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || undefined,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || undefined,

  FFMPEG_PATH: process.env.FFMPEG_PATH || undefined,
  FFPROBE_PATH: process.env.FFPROBE_PATH || undefined,
});

if (!parsedEnv.success) {
  console.error(z.flattenError(parsedEnv.error).fieldErrors);
  throw new Error("Ungültige Umgebungsvariablen");
}

export const env = parsedEnv.data;
