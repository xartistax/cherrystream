import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { NotificationSettingsForm } from "./notification-settings-form";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function NotificationSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const settings = await prisma.notificationSettings.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      marketingEmails: true,
      accountEmails: true,
      newFollowers: true,
      postLikes: true,
      profileViews: true,
      contactClicks: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div>
        <Link
          href="/settings"
          className={cn(
            buttonVariants({
              variant: "ghost",
              size: "sm",
            }),
            "-ml-3 mb-4 text-zinc-400 hover:bg-white/5 hover:text-white",
          )}
        >
          <ArrowLeft className="size-4" />
          Einstellungen
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Benachrichtigungen</h1>

        <p className="mt-2 text-sm text-zinc-400 sm:text-base">Verwalte deine E-Mail- und Aktivitätsbenachrichtigungen.</p>
      </div>

      <NotificationSettingsForm
        initialValues={{
          marketingEmails: settings?.marketingEmails ?? false,
          accountEmails: settings?.accountEmails ?? true,
          newFollowers: settings?.newFollowers ?? true,
          postLikes: settings?.postLikes ?? true,
          profileViews: settings?.profileViews ?? true,
          contactClicks: settings?.contactClicks ?? true,
        }}
      />
    </div>
  );
}
