import "server-only";

import { prisma } from "@/lib/prisma";
import { purgeVerificationDocuments } from "@/lib/verification/purge-documents";

export type CleanupResult = {
  expiredInvitesDeleted: number;
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
    verificationDocumentsPurged,
  };
}
