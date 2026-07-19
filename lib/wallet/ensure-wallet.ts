import "server-only";

import { prisma } from "@/lib/prisma";

export async function ensureWallet(userId: string) {
  return prisma.wallet.upsert({
    where: {
      userId,
    },

    create: {
      userId,
    },

    update: {},

    select: {
      id: true,
      userId: true,
      userCredits: true,
      earningsRappen: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
