-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminAlertEvent" ADD VALUE 'INVITE_DECLINED';
ALTER TYPE "AdminAlertEvent" ADD VALUE 'ACCOUNT_DELETED';
ALTER TYPE "AdminAlertEvent" ADD VALUE 'ORDER_PAID';
ALTER TYPE "AdminAlertEvent" ADD VALUE 'PAYMENT_PROBLEM';
ALTER TYPE "AdminAlertEvent" ADD VALUE 'SYSTEM_PROBLEM';
ALTER TYPE "AdminAlertEvent" ADD VALUE 'VERIFICATION_OVERDUE';
ALTER TYPE "AdminAlertEvent" ADD VALUE 'DAILY_SUMMARY';
