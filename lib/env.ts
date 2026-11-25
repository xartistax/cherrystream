import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  BLOB_READ_WRITE_TOKEN: z.string().min(1),
  VERIFICATION_BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),

  NEXT_PUBLIC_APP_URL: z.url().optional(),
  NEXT_PUBLIC_PAYMENTS_ENABLED: z.enum(["true", "false"]).optional(),

  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),

  CRON_SECRET: z.string().min(16).optional(),

  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(3).optional(),
  EMAIL_DEV_REDIRECT: z.email().optional(),

  FFMPEG_PATH: z.string().min(1).optional(),
  FFPROBE_PATH: z.string().min(1).optional(),
});

const parsedEnv = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  VERIFICATION_BLOB_READ_WRITE_TOKEN: process.env.VERIFICATION_BLOB_READ_WRITE_TOKEN || undefined,

  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || undefined,
  NEXT_PUBLIC_PAYMENTS_ENABLED: process.env.NEXT_PUBLIC_PAYMENTS_ENABLED || undefined,

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || undefined,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || undefined,

  CRON_SECRET: process.env.CRON_SECRET || undefined,

  RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
  EMAIL_FROM: process.env.EMAIL_FROM || undefined,
  EMAIL_DEV_REDIRECT: process.env.EMAIL_DEV_REDIRECT || undefined,

  FFMPEG_PATH: process.env.FFMPEG_PATH || undefined,
  FFPROBE_PATH: process.env.FFPROBE_PATH || undefined,
});

if (!parsedEnv.success) {
  console.error(z.flattenError(parsedEnv.error).fieldErrors);
  throw new Error("Ungültige Umgebungsvariablen");
}

export const env = parsedEnv.data;
