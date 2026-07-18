import { config } from "dotenv";

config({
  path: ".env.local",
});

import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../generated/prisma/client";
import { cantons } from "./seed/cantons";
import { categories } from "./seed/categories";
import { swissCities } from "./seed/cities";
import { seedCreators } from "./seed/creators";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL fehlt.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({
    connectionString,
  }),
});

async function seedCategories(): Promise<void> {
  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      create: category,
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });
  }
}

async function seedCantons(): Promise<Map<string, string>> {
  for (const canton of cantons) {
    await prisma.canton.upsert({
      where: {
        slug: canton.slug,
      },
      create: canton,
      update: {
        name: canton.name,
        sortOrder: canton.sortOrder,
      },
    });
  }

  const storedCantons = await prisma.canton.findMany({
    select: {
      id: true,
      slug: true,
    },
  });

  return new Map(storedCantons.map((canton) => [canton.slug, canton.id]));
}

async function seedCities(cantonIds: Map<string, string>): Promise<void> {
  for (const [index, city] of swissCities.entries()) {
    const cantonId = cantonIds.get(city.canton);

    if (!cantonId) {
      throw new Error(`Kanton "${city.canton}" für Stadt "${city.name}" wurde nicht gefunden.`);
    }

    await prisma.city.upsert({
      where: {
        cantonId_slug: {
          cantonId,
          slug: city.slug,
        },
      },
      create: {
        name: city.name,
        slug: city.slug,
        sortOrder: index,
        cantonId,
      },
      update: {
        name: city.name,
        sortOrder: index,
      },
    });
  }
}

async function main(): Promise<void> {
  console.log("Seeding started.");

  await seedCategories();

  const cantonIds = await seedCantons();

  await seedCities(cantonIds);

  console.log("Seed completed.");
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
