/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `WalletTransaction` will be added. If there are existing duplicate values, this will fail.
  - Made the column `balanceUserCredits` on table `WalletTransaction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `balanceCreatorCredits` on table `WalletTransaction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `balanceEarningsRappen` on table `WalletTransaction` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "WalletTransaction_type_idx";

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "balanceType" "WalletBalanceType" NOT NULL DEFAULT 'USER_CREDITS',
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "referenceId" TEXT,
ALTER COLUMN "balanceUserCredits" SET NOT NULL,
ALTER COLUMN "balanceUserCredits" SET DEFAULT 0,
ALTER COLUMN "balanceCreatorCredits" SET NOT NULL,
ALTER COLUMN "balanceCreatorCredits" SET DEFAULT 0,
ALTER COLUMN "balanceEarningsRappen" SET NOT NULL,
ALTER COLUMN "balanceEarningsRappen" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_idempotencyKey_key" ON "WalletTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "WalletTransaction_type_createdAt_idx" ON "WalletTransaction"("type", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_referenceId_idx" ON "WalletTransaction"("referenceId");
