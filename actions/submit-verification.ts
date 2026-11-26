"use server";

import { revalidatePath } from "next/cache";

import { getCreatorAccess } from "@/lib/access";
import { notifyAdmins } from "@/lib/admin-alerts/alerts";
import { auth } from "@/lib/auth";
import { getAdminEmails, sendEmail } from "@/lib/email/send";
import { adminNewVerificationEmail, getAppUrl } from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";
import { getChallengeCode } from "@/lib/verification/challenge";
import { deleteVerificationImages, storeVerificationImage, VerificationImageError } from "@/lib/verification/storage";

export type SubmitVerificationResult = {
  success: boolean;
  message?: string;
};

function getFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);

  return value instanceof File && value.size > 0 ? value : null;
}

export async function submitVerificationAction(formData: FormData): Promise<SubmitVerificationResult> {
  if ((await auth())?.user?.impersonatedBy) {
    return {
      success: false,
      message: "Diese Aktion ist in der Admin-Ansicht gesperrt. Beende zuerst die Model-Ansicht.",
    };
  }

  const access = await getCreatorAccess();

  if (!access.allowed) {
    return {
      success: false,
      message: access.message,
    };
  }

  if (access.role !== "MODEL" || access.modelStatus !== "PENDING") {
    return {
      success: false,
      message: "Für dein Konto ist keine Verifizierung nötig.",
    };
  }

  if (formData.get("consent") !== "on") {
    return {
      success: false,
      message: "Bitte bestätige die Einwilligung zur Prüfung deiner Dokumente.",
    };
  }

  const idDocument = getFile(formData, "idDocument");
  const selfie = getFile(formData, "selfie");

  if (!idDocument || !selfie) {
    return {
      success: false,
      message: "Bitte lade ein Foto deines Ausweises und ein Selfie mit dem Code hoch.",
    };
  }

  const userId = access.userId;

  const account = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      username: true,
      emailVerified: true,
    },
  });

  // The approval or rejection is sent by email, so the address must work.
  if (!account?.emailVerified) {
    return {
      success: false,
      message: "Bitte bestätige zuerst deine E-Mail-Adresse. Den Link findest du in deinem Postfach oder oben im Hinweis.",
    };
  }

  const [pendingCount, attempts] = await Promise.all([
    prisma.modelVerification.count({
      where: {
        userId,
        status: "PENDING",
      },
    }),
    prisma.modelVerification.count({
      where: {
        userId,
      },
    }),
  ]);

  if (pendingCount > 0) {
    return {
      success: false,
      message: "Deine Verifizierung wird bereits geprüft.",
    };
  }

  const storedPathnames: string[] = [];

  try {
    const idDocumentPathname = await storeVerificationImage(userId, "id-document", idDocument);
    storedPathnames.push(idDocumentPathname);

    const selfiePathname = await storeVerificationImage(userId, "selfie", selfie);
    storedPathnames.push(selfiePathname);

    const verification = await prisma.modelVerification.create({
      data: {
        userId,
        challengeCode: getChallengeCode(userId, attempts),
        idDocumentPathname,
        selfiePathname,
      },
      select: {
        id: true,
      },
    });

    const adminEmails = await getAdminEmails();

    if (adminEmails.length > 0) {
      await sendEmail({
        to: adminEmails,
        ...adminNewVerificationEmail(account.username, getAppUrl(`/admin/verifications/${verification.id}`)),
      });
    }

    notifyAdmins("VERIFICATION_SUBMITTED", {
      lines: [`@${account.username}`],
      path: `/admin/verifications/${verification.id}`,
    });
  } catch (error) {
    await deleteVerificationImages(storedPathnames).catch((cleanupError: unknown) => {
      console.error("Verification blob cleanup failed:", cleanupError);
    });

    console.error("Submit verification failed:", error);

    return {
      success: false,
      message: error instanceof VerificationImageError ? error.message : "Die Verifizierung konnte nicht eingereicht werden.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/verification");

  return {
    success: true,
  };
}
