-- CreateEnum
CREATE TYPE "BoostType" AS ENUM ('BUMP', 'AUTO_BUMP', 'HIGHLIGHT');

-- AlterEnum
ALTER TYPE "WalletTransactionType" ADD VALUE 'STARTER_CREDIT';

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "bumpedAt" TIMESTAMP(3),
ADD COLUMN     "highlightUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Boost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BoostType" NOT NULL,
    "option" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "intervalMinutes" INTEGER,
    "credits" INTEGER NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Boost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Boost_transactionId_key" ON "Boost"("transactionId");

-- CreateIndex
CREATE INDEX "Boost_userId_createdAt_idx" ON "Boost"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Boost_type_endsAt_idx" ON "Boost"("type", "endsAt");

-- CreateIndex
CREATE INDEX "Profile_bumpedAt_idx" ON "Profile"("bumpedAt" DESC);

-- AddForeignKey
ALTER TABLE "Boost" ADD CONSTRAINT "Boost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Boost" ADD CONSTRAINT "Boost_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Existing public models keep their current order: their first bump is their registration time.
UPDATE "Profile" p
SET "bumpedAt" = u."createdAt"
FROM "User" u
WHERE p."userId" = u."id"
  AND u."modelStatus" = 'ACTIVE'
  AND p."bumpedAt" IS NULL;
