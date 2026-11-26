-- CreateEnum
CREATE TYPE "AdminAlertEvent" AS ENUM ('VERIFICATION_SUBMITTED', 'REPORT_CREATED', 'INVITE_CLAIMED', 'MODEL_REGISTERED');

-- AlterEnum
ALTER TYPE "AdminAction" ADD VALUE 'ALERT_SETTING_CHANGED';

-- CreateTable
CREATE TABLE "AdminAlertSetting" (
    "event" "AdminAlertEvent" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAlertSetting_pkey" PRIMARY KEY ("event")
);
