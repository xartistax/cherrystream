-- AlterEnum
ALTER TYPE "Gender" ADD VALUE 'TRANS';
ALTER TYPE "Gender" ADD VALUE 'COUPLE';

-- AlterTable
ALTER TABLE "ModelInvite" ADD COLUMN "gender" "Gender";

-- Every listing so far is a woman; set it where it was left empty so the new filter finds them.
UPDATE "Profile" AS p
SET "gender" = 'WOMAN'
FROM "User" AS u
WHERE u."id" = p."userId" AND u."role" = 'MODEL' AND p."gender" IS NULL;
