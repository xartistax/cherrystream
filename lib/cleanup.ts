import "server-only";

import { prisma } from "@/lib/prisma";
import { purgeVerificationDocuments } from "@/lib/verification/purge-documents";

export type CleanupResult = {
  expiredInvitesDeleted: number;
  creditOrdersExpired: number;
  rateLimitsDeleted: number;
  verificationDocumentsPurged: boolean;
};

/** Data minimisation tasks, run daily by the Vercel cron (/api/cron/cleanup). */
export async function runCleanup(): Promise<CleanupResult> {
  const expiredInvites = await prisma.modelInvite.deleteMany({
    where: {
      status: "OPEN",
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  // A checkout that was never finished within a day will not be confirmed anymore.
  const staleOrders = await prisma.creditOrder.updateMany({
    where: {
      status: "PENDING",
      createdAt: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    data: {
      status: "EXPIRED",
    },
  });

  // The longest rate-limit window is one hour; a day keeps the table small with plenty of margin.
  const rateLimits = await prisma.rateLimit.deleteMany({
    where: {
      windowStart: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  let verificationDocumentsPurged = true;

  try {
    // Leftovers from failed purges after a review or an account deletion.
    await purgeVerificationDocuments({
      OR: [
        {
          status: {
            not: "PENDING",
          },
        },
        {
          user: {
            status: "DELETED",
          },
        },
      ],
    });
  } catch (error) {
    verificationDocumentsPurged = false;
    console.error("Cleanup: verification document purge failed:", error);
  }

  return {
    expiredInvitesDeleted: expiredInvites.count,
    creditOrdersExpired: staleOrders.count,
    rateLimitsDeleted: rateLimits.count,
    verificationDocumentsPurged,
  };
}
