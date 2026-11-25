import { config } from "dotenv";

// Same files as Next.js and prisma.config.ts: .env.local wins over .env. Must be the first import of every script.
config({
  path: [".env.local", ".env"],
  quiet: true,
});
