-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('TEST');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('TEST', 'LIVE');

-- CreateEnum
CREATE TYPE "CreditOrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "CreditOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "priceRappen" INTEGER NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "mode" "PaymentMode" NOT NULL,
    "status" "CreditOrderStatus" NOT NULL DEFAULT 'PENDING',
    "providerReference" TEXT,
    "transactionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditOrder_transactionId_key" ON "CreditOrder"("transactionId");

-- CreateIndex
CREATE INDEX "CreditOrder_userId_createdAt_idx" ON "CreditOrder"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CreditOrder_status_createdAt_idx" ON "CreditOrder"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "CreditOrder" ADD CONSTRAINT "CreditOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditOrder" ADD CONSTRAINT "CreditOrder_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
