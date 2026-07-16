/*
  Warnings:

  - A unique constraint covering the columns `[cantonId,slug]` on the table `City` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "City_slug_key";

-- CreateIndex
CREATE INDEX "City_cantonId_idx" ON "City"("cantonId");

-- CreateIndex
CREATE UNIQUE INDEX "City_cantonId_slug_key" ON "City"("cantonId", "slug");
