/*
  Warnings:

  - You are about to drop the column `city` on the `Profile` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Profile_city_idx";

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "city",
ADD COLUMN     "cantonId" TEXT,
ADD COLUMN     "cityId" TEXT;

-- CreateTable
CREATE TABLE "Canton" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Canton_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "cantonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Canton_slug_key" ON "Canton"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE INDEX "Profile_cityId_idx" ON "Profile"("cityId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_cantonId_fkey" FOREIGN KEY ("cantonId") REFERENCES "Canton"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_cantonId_fkey" FOREIGN KEY ("cantonId") REFERENCES "Canton"("id") ON DELETE CASCADE ON UPDATE CASCADE;
