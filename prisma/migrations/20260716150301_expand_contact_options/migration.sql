/*
  Warnings:

  - You are about to drop the column `whatsappNumber` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContactChannel" ADD VALUE 'SIGNAL';
ALTER TYPE "ContactChannel" ADD VALUE 'INSTAGRAM';
ALTER TYPE "ContactChannel" ADD VALUE 'EMAIL';

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "whatsappNumber",
ADD COLUMN     "contactNote" TEXT,
ADD COLUMN     "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailPublic" TEXT,
ADD COLUMN     "instagramEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "preferredContact" "ContactChannel",
ADD COLUMN     "signalEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "signalNumber" TEXT,
ADD COLUMN     "telegramEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telegramUsername" TEXT,
ADD COLUMN     "websiteEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;
