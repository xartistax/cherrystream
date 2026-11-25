import "dotenv/config";

import { defineConfig } from "prisma/config";

// Migrations need a direct (unpooled) connection. DIRECT_URL wins locally; on Vercel the Neon integration
// provides DATABASE_URL_UNPOOLED for the same database as DATABASE_URL, so the two cannot drift apart.
const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED;

if (!directUrl) {
  throw new Error("DIRECT_URL oder DATABASE_URL_UNPOOLED fehlt.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl,
  },
});
