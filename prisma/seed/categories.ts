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

export const categories = [
  { name: "Lifestyle", slug: "lifestyle", sortOrder: 10 },
  { name: "Fashion", slug: "fashion", sortOrder: 20 },
  { name: "Fitness", slug: "fitness", sortOrder: 30 },
  { name: "Beauty", slug: "beauty", sortOrder: 40 },
  { name: "Cosplay", slug: "cosplay", sortOrder: 50 },
  { name: "Gaming", slug: "gaming", sortOrder: 60 },
  { name: "Travel", slug: "travel", sortOrder: 70 },
  { name: "Music", slug: "music", sortOrder: 80 },
  { name: "Art", slug: "art", sortOrder: 90 },
  { name: "Alternative", slug: "alternative", sortOrder: 100 },
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
