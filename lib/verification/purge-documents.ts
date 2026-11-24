import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteVerificationImages } from "@/lib/verification/storage";

/**
 * Deletes the private ID and selfie blobs and keeps only the verification record (data minimisation).
 * Called after an admin review and when an account is deleted.
 */
export async function purgeVerificationDocuments(where: Prisma.ModelVerificationWhereInput): Promise<void> {
  const verifications = await prisma.modelVerification.findMany({
    where: {
      ...where,
      documentsDeletedAt: null,
    },
    select: {
      id: true,
      idDocumentPathname: true,
      selfiePathname: true,
    },
  });

  if (verifications.length === 0) {
    return;
  }

  await deleteVerificationImages(verifications.flatMap((verification) => [verification.idDocumentPathname, verification.selfiePathname]));

  await prisma.modelVerification.updateMany({
    where: {
      id: {
        in: verifications.map((verification) => verification.id),
      },
    },
    data: {
      idDocumentPathname: null,
      selfiePathname: null,
      documentsDeletedAt: new Date(),
    },
  });
}
