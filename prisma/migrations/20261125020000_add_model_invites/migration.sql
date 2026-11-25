-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('OPEN', 'CLAIMED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminAction" ADD VALUE 'INVITE_CREATED';
ALTER TYPE "AdminAction" ADD VALUE 'INVITE_RENEWED';
ALTER TYPE "AdminAction" ADD VALUE 'INVITE_REVOKED';

-- CreateTable
CREATE TABLE "ModelInvite" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "cantonId" TEXT,
    "cityId" TEXT,
    "categoryIds" TEXT[],
    "phoneNumber" TEXT,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "telegramUsername" TEXT,
    "instagram" TEXT,
    "website" TEXT,
    "sourceNote" TEXT,
    "createdById" TEXT,
    "claimedById" TEXT,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeclinedContact" (
    "contactHash" TEXT NOT NULL,
    "declinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeclinedContact_pkey" PRIMARY KEY ("contactHash")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModelInvite_tokenHash_key" ON "ModelInvite"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "ModelInvite_claimedById_key" ON "ModelInvite"("claimedById");

-- CreateIndex
CREATE INDEX "ModelInvite_status_expiresAt_idx" ON "ModelInvite"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "ModelInvite_phoneNumber_idx" ON "ModelInvite"("phoneNumber");

-- AddForeignKey
ALTER TABLE "ModelInvite" ADD CONSTRAINT "ModelInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelInvite" ADD CONSTRAINT "ModelInvite_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

