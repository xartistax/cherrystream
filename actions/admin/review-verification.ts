"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getAdminAccess } from "@/lib/access";
import { logAdminAction } from "@/lib/admin/audit";
import { sendEmail } from "@/lib/email/send";
import { getAppUrl, verificationApprovedEmail, verificationRejectedEmail } from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";
import { purgeVerificationDocuments } from "@/lib/verification/purge-documents";

export type ReviewVerificationState = {
  success: boolean;
  message?: string;
};

class AlreadyReviewedError extends Error {}

const reviewSchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("APPROVE"),
    verificationId: z.string().min(1),
    ageConfirmed: z.literal("on", {
      error: "Bitte bestätige, dass Alter, Identität und Code geprüft wurden.",
    }),
  }),
  z.object({
    decision: z.literal("REJECT"),
    verificationId: z.string().min(1),
    rejectionReason: z.string().trim().min(10, "Bitte begründe die Ablehnung (mindestens 10 Zeichen).").max(500),
  }),
]);

export async function reviewVerificationAction(_previousState: ReviewVerificationState, formData: FormData): Promise<ReviewVerificationState> {
  const access = await getAdminAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  const parsed = reviewSchema.safeParse({
    decision: formData.get("decision"),
    verificationId: formData.get("verificationId"),
    ageConfirmed: formData.get("ageConfirmed") ?? undefined,
    rejectionReason: formData.get("rejectionReason") ?? undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Ungültige Eingabe.",
    };
  }

  const input = parsed.data;

  const verification = await prisma.modelVerification.findUnique({
    where: {
      id: input.verificationId,
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          username: true,
          email: true,
          name: true,
          profile: {
            select: {
              displayName: true,
            },
          },
        },
      },
    },
  });

  if (!verification) {
    return {
      success: false,
      message: "Die Verifizierung wurde nicht gefunden.",
    };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      // The status condition guards against two admins reviewing the same submission at once.
      const updated = await transaction.modelVerification.updateMany({
        where: {
          id: verification.id,
          status: "PENDING",
        },
        data: {
          status: input.decision === "APPROVE" ? "APPROVED" : "REJECTED",
          reviewedAt: new Date(),
          reviewedById: access.userId,
          rejectionReason: input.decision === "REJECT" ? input.rejectionReason : null,
        },
      });

      if (updated.count === 0) {
        throw new AlreadyReviewedError();
      }

      if (input.decision === "APPROVE") {
        await transaction.user.update({
          where: {
            id: verification.userId,
          },
          data: {
            modelStatus: "ACTIVE",
          },
        });

        await transaction.profile.updateMany({
          where: {
            userId: verification.userId,
          },
          data: {
            verified: true,
          },
        });
      }

      await logAdminAction(transaction, {
        actorId: access.userId,
        action: input.decision === "APPROVE" ? "VERIFICATION_APPROVED" : "VERIFICATION_REJECTED",
        targetType: "ModelVerification",
        targetId: verification.id,
        metadata: {
          userId: verification.userId,
          username: verification.user.username,
          ...(input.decision === "REJECT" ? { rejectionReason: input.rejectionReason } : {}),
        },
      });
    });
  } catch (error) {
    if (error instanceof AlreadyReviewedError) {
      return {
        success: false,
        message: "Diese Verifizierung wurde bereits bearbeitet.",
      };
    }

    throw error;
  }

  try {
    await purgeVerificationDocuments({
      id: verification.id,
    });
  } catch (error) {
    // The record keeps its pathnames (documentsDeletedAt null), so the status page flags it for cleanup.
    console.error("Verification document purge after review failed:", error);
  }

  const displayName = verification.user.profile?.displayName ?? verification.user.name ?? verification.user.username;

  // A failed mail must not undo the review; sendEmail logs failures itself.
  await sendEmail({
    to: verification.user.email,
    ...(input.decision === "APPROVE"
      ? verificationApprovedEmail(displayName, getAppUrl(`/profile/${verification.user.username}`))
      : verificationRejectedEmail(displayName, input.rejectionReason)),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/verifications");
  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath(`/profile/${verification.user.username}`);

  redirect("/admin/verifications");
}
