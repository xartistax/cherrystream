-- CreateTable
CREATE TABLE "NotificationSettings" (
    "userId" TEXT NOT NULL,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "accountEmails" BOOLEAN NOT NULL DEFAULT true,
    "newFollowers" BOOLEAN NOT NULL DEFAULT true,
    "postLikes" BOOLEAN NOT NULL DEFAULT true,
    "profileViews" BOOLEAN NOT NULL DEFAULT true,
    "contactClicks" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "NotificationSettings" ADD CONSTRAINT "NotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
