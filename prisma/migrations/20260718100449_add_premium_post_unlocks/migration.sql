/*
  Warnings:

  - The primary key for the `PostUnlock` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[buyerTransactionId]` on the table `PostUnlock` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[creatorTransactionId]` on the table `PostUnlock` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,postId]` on the table `PostUnlock` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `buyerTransactionId` to the `PostUnlock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorEarningsRappen` to the `PostUnlock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorTransactionId` to the `PostUnlock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grossRappen` to the `PostUnlock` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `PostUnlock` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `platformFeeRappen` to the `PostUnlock` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "premiumPriceCredits" INTEGER;

-- AlterTable
ALTER TABLE "PostUnlock" DROP CONSTRAINT "PostUnlock_pkey",
ADD COLUMN     "buyerTransactionId" TEXT NOT NULL,
ADD COLUMN     "creatorEarningsRappen" INTEGER NOT NULL,
ADD COLUMN     "creatorTransactionId" TEXT NOT NULL,
ADD COLUMN     "grossRappen" INTEGER NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "platformFeeRappen" INTEGER NOT NULL,
ADD CONSTRAINT "PostUnlock_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "WalletTransaction" ALTER COLUMN "balanceType" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "PostUnlock_buyerTransactionId_key" ON "PostUnlock"("buyerTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "PostUnlock_creatorTransactionId_key" ON "PostUnlock"("creatorTransactionId");

-- CreateIndex
CREATE INDEX "PostUnlock_userId_createdAt_idx" ON "PostUnlock"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PostUnlock_userId_postId_key" ON "PostUnlock"("userId", "postId");

-- AddForeignKey
ALTER TABLE "PostUnlock" ADD CONSTRAINT "PostUnlock_buyerTransactionId_fkey" FOREIGN KEY ("buyerTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostUnlock" ADD CONSTRAINT "PostUnlock_creatorTransactionId_fkey" FOREIGN KEY ("creatorTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
