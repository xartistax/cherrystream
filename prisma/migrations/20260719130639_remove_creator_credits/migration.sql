/*
  Warnings:

  - The values [CREATOR_CREDITS] on the enum `WalletBalanceType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `creatorCredits` on the `Wallet` table. All the data in the column will be lost.
  - You are about to drop the column `balanceCreatorCredits` on the `WalletTransaction` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WalletBalanceType_new" AS ENUM ('USER_CREDITS', 'EARNINGS');
ALTER TABLE "WalletTransaction" ALTER COLUMN "balanceType" TYPE "WalletBalanceType_new" USING ("balanceType"::text::"WalletBalanceType_new");
ALTER TYPE "WalletBalanceType" RENAME TO "WalletBalanceType_old";
ALTER TYPE "WalletBalanceType_new" RENAME TO "WalletBalanceType";
DROP TYPE "public"."WalletBalanceType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Wallet" DROP COLUMN "creatorCredits";

-- AlterTable
ALTER TABLE "WalletTransaction" DROP COLUMN "balanceCreatorCredits";
