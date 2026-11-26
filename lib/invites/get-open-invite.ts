import "server-only";

import { hashInviteToken } from "@/lib/invites/token";
import { prisma } from "@/lib/prisma";

/** Returns the invite only while it is open and not expired; anything else looks like an unknown link. */
export async function getOpenInvite(token: string) {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) {
    return null;
  }

  return prisma.modelInvite.findFirst({
    where: {
      tokenHash: hashInviteToken(token),
      status: "OPEN",
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      displayName: true,
      bio: true,
      cantonId: true,
      cityId: true,
      categoryIds: true,
      serviceIds: true,
      phoneNumber: true,
      whatsappEnabled: true,
      telegramUsername: true,
      signalNumber: true,
      instagram: true,
      website: true,
      contactNote: true,
      expiresAt: true,
    },
  });
}
