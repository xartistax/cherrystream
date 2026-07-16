-- CreateEnum
CREATE TYPE "ContactChannel" AS ENUM ('WHATSAPP', 'TELEGRAM', 'PHONE', 'WEBSITE');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "whatsappNumber" TEXT;

-- CreateTable
CREATE TABLE "ContactClick" (
    "id" TEXT NOT NULL,
    "profileUserId" TEXT NOT NULL,
    "visitorId" TEXT,
    "channel" "ContactChannel" NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactClick_profileUserId_clickedAt_idx" ON "ContactClick"("profileUserId", "clickedAt");

-- CreateIndex
CREATE INDEX "ContactClick_profileUserId_channel_clickedAt_idx" ON "ContactClick"("profileUserId", "channel", "clickedAt");

-- CreateIndex
CREATE INDEX "ContactClick_visitorId_clickedAt_idx" ON "ContactClick"("visitorId", "clickedAt");

-- AddForeignKey
ALTER TABLE "ContactClick" ADD CONSTRAINT "ContactClick_profileUserId_fkey" FOREIGN KEY ("profileUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactClick" ADD CONSTRAINT "ContactClick_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
