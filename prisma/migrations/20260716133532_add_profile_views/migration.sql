/*
  Warnings:

  - You are about to drop the column `country` on the `Profile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Profile_country_idx";

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "country";

-- CreateTable
CREATE TABLE "ProfileView" (
    "id" TEXT NOT NULL,
    "profileUserId" TEXT NOT NULL,
    "viewerId" TEXT,
    "visitorHash" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileView_profileUserId_viewedAt_idx" ON "ProfileView"("profileUserId", "viewedAt");

-- CreateIndex
CREATE INDEX "ProfileView_profileUserId_visitorHash_viewedAt_idx" ON "ProfileView"("profileUserId", "visitorHash", "viewedAt");

-- CreateIndex
CREATE INDEX "ProfileView_viewerId_viewedAt_idx" ON "ProfileView"("viewerId", "viewedAt");

-- CreateIndex
CREATE INDEX "Profile_cantonId_idx" ON "Profile"("cantonId");

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_profileUserId_fkey" FOREIGN KEY ("profileUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
