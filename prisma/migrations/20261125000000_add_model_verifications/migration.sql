-- CreateTable
CREATE TABLE "ModelVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "challengeCode" TEXT NOT NULL,
    "idDocumentPathname" TEXT,
    "selfiePathname" TEXT,
    "documentsDeletedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "ModelVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModelVerification_status_submittedAt_idx" ON "ModelVerification"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "ModelVerification_userId_submittedAt_idx" ON "ModelVerification"("userId", "submittedAt");

-- AddForeignKey
ALTER TABLE "ModelVerification" ADD CONSTRAINT "ModelVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelVerification" ADD CONSTRAINT "ModelVerification_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

