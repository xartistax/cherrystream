import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountForms } from "./account-forms";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function AccountSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      email: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

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

        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Konto & Sicherheit</h1>

        <p className="mt-2 text-sm text-zinc-400 sm:text-base">Verwalte deine Anmeldedaten und die Sicherheit deines Kontos.</p>
      </div>

      <AccountForms email={user.email} />
    </div>
  );
}
