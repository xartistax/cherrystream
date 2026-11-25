-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "avatarMediaId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Profile_avatarMediaId_key" ON "Profile"("avatarMediaId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_avatarMediaId_fkey" FOREIGN KEY ("avatarMediaId") REFERENCES "PostMedia"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Gallery model: the follower-only visibility is gone, existing uploads become public.
UPDATE "Post" SET "visibility" = 'PUBLIC' WHERE "visibility" = 'FOLLOWERS';
