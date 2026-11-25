import "../prisma/seed/env";

import { syncProfileImage } from "@/lib/gallery/profile-image";
import { prisma } from "@/lib/prisma";

/**
 * Applies the gallery rule to existing accounts once: profile picture = chosen image, otherwise the first uploaded one.
 * Safe to run repeatedly. Usage: pnpm sync-profile-images
 */
async function main(): Promise<void> {
  const models = await prisma.user.findMany({
    where: {
      role: "MODEL",
    },
    select: {
      id: true,
      username: true,
      image: true,
    },
  });

  let changed = 0;

  for (const model of models) {
    await syncProfileImage(model.id);

    const updated = await prisma.user.findUniqueOrThrow({
      where: {
        id: model.id,
      },
      select: {
        image: true,
      },
    });

    if (updated.image !== model.image) {
      changed += 1;
    }
  }

  console.log(`${models.length} Model-Konten geprüft, ${changed} Profilbild(er) aktualisiert.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Keine Verbindung zur Datenbank. Prüfe DATABASE_URL.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
