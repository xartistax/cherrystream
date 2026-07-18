/*
  Warnings:

  - You are about to drop the column `isPremium` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `premiumPriceCredits` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "isPremium",
DROP COLUMN "premiumPriceCredits";
