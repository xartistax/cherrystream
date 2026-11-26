import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../../generated/prisma/client";

import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL fehlt.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({
    connectionString,
  }),
});

// Rubriken as on xDate (docs: chosen subset for a directory of verified models).
export const categories = [
  { name: "Escort Service", slug: "escort", sortOrder: 10 },
  { name: "Massagen", slug: "massagen", sortOrder: 20 },
  { name: "Domina / BDSM Sex", slug: "domina-bdsm", sortOrder: 30 },
  { name: "Transsexuelle / Transen", slug: "trans", sortOrder: 40 },
  { name: "MILF & reife Frauen", slug: "milf", sortOrder: 50 },
] as const;

async function main() {
  await Promise.all(
    categories.map((category) =>
      prisma.category.upsert({
        where: {
          slug: category.slug,
        },
        create: category,
        update: {
          name: category.name,
          sortOrder: category.sortOrder,
          isActive: true,
        },
      }),
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
