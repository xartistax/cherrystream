-- CreateEnum
CREATE TYPE "ModelStatus" AS ENUM ('NONE', 'PENDING', 'ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "modelStatus" "ModelStatus" NOT NULL DEFAULT 'NONE';
