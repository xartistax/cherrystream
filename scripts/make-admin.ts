import { config } from "dotenv";

config({
  path: [".env.local", ".env"],
});

import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../generated/prisma/client";

/**
 * Grants or revokes the ADMIN role for an existing account.
 * Usage: pnpm make-admin <email> [--revoke]
 */
async function main(): Promise<void> {
  const [email, flag] = process.argv.slice(2);

  if (!email) {
    throw new Error("Bitte E-Mail angeben: pnpm make-admin <email> [--revoke]");
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL fehlt.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({
      connectionString,
    }),
  });

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
      select: {
        id: true,
        username: true,
        role: true,
        status: true,
        profile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(`Kein Konto mit der E-Mail ${email} gefunden. Bitte zuerst registrieren.`);
    }

    if (user.status !== "ACTIVE") {
      throw new Error(`Das Konto @${user.username} ist nicht aktiv (${user.status}).`);
    }

    if (flag === "--revoke") {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          // Accounts with a model profile fall back to MODEL, everyone else to USER.
          role: user.profile ? "MODEL" : "USER",
        },
      });

      console.log(`@${user.username} ist kein Admin mehr.`);
      return;
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        role: "ADMIN",
      },
    });

    console.log(`@${user.username} ist jetzt Admin. Bitte einmal ab- und wieder anmelden.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
