-- AlterEnum
ALTER TYPE "AdminAction" ADD VALUE 'INVITE_UPDATED';

-- AlterTable
ALTER TABLE "ModelInvite" ADD COLUMN     "contactNote" TEXT,
ADD COLUMN     "serviceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "signalNumber" TEXT;
