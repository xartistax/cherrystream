-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "PostMedia" ADD COLUMN     "blurHash" TEXT,
ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "feedPathname" TEXT,
ADD COLUMN     "feedUrl" TEXT,
ADD COLUMN     "fullPathname" TEXT,
ADD COLUMN     "fullUrl" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "originalPathname" TEXT,
ADD COLUMN     "originalUrl" TEXT,
ADD COLUMN     "profilePathname" TEXT,
ADD COLUMN     "profileUrl" TEXT,
ADD COLUMN     "status" "MediaStatus" NOT NULL DEFAULT 'PROCESSING',
ADD COLUMN     "width" INTEGER;

-- CreateIndex
CREATE INDEX "PostMedia_status_idx" ON "PostMedia"("status");

-- CreateIndex
CREATE INDEX "PostMedia_checksum_idx" ON "PostMedia"("checksum");
