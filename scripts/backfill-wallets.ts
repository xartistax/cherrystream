import { prisma } from "@/lib/prisma";

const BATCH_SIZE = 100;

async function main(): Promise<void> {
  let cursor: string | undefined;

  while (true) {
    const users = await prisma.user.findMany({
      take: BATCH_SIZE,
      ...(cursor
        ? {
            skip: 1,
            cursor: {
              id: cursor,
            },
          }
        : {}),
      select: {
        id: true,
        credits: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    if (users.length === 0) {
      break;
    }

    await prisma.$transaction(
      users.map((user) =>
        prisma.wallet.upsert({
          where: {
            userId: user.id,
          },
          create: {
            userId: user.id,
            userCredits: user.credits,
          },
          update: {},
        }),
      ),
    );

    cursor = users.at(-1)?.id;
  }

  console.log("Wallet backfill completed.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
