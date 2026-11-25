import "server-only";

import type { ModelStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getChallengeCode } from "@/lib/verification/challenge";

export type VerificationOverview =
  | {
      state: "VERIFIED";
    }
  | {
      state: "IN_REVIEW";
      submittedAt: Date;
    }
  | {
      state: "REQUIRED";
      challengeCode: string;
      rejectionReason: string | null;
    };

export async function getVerificationOverview(userId: string, modelStatus: ModelStatus): Promise<VerificationOverview> {
  if (modelStatus === "ACTIVE") {
    return {
      state: "VERIFIED",
    };
  }

  const [latest, attempts] = await Promise.all([
    prisma.modelVerification.findFirst({
      where: {
        userId,
      },
      orderBy: {
        submittedAt: "desc",
      },
      select: {
        status: true,
        submittedAt: true,
        rejectionReason: true,
      },
    }),
    prisma.modelVerification.count({
      where: {
        userId,
      },
    }),
  ]);

  if (latest?.status === "PENDING") {
    return {
      state: "IN_REVIEW",
      submittedAt: latest.submittedAt,
    };
  }

  return {
    state: "REQUIRED",
    challengeCode: getChallengeCode(userId, attempts),
    rejectionReason: latest?.status === "REJECTED" ? latest.rejectionReason : null,
  };
}
