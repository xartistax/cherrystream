import { ArrowLeft, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ModelProfileForm } from "@/components/become-model/model-profile-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Inserat einrichten",
};

export default async function BecomeModelProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role === "MODEL" || session.user.role === "ADMIN") {
    redirect("/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      username: true,
      name: true,
      profile: {
        select: {
          displayName: true,
          bio: true,
          gender: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8 sm:py-12">
      <div className="flex items-center gap-4">
        <Link
          href="/become-model"
          aria-label="Zurück"
          className={cn(
            buttonVariants({
              variant: "outline",
              size: "icon",
            }),
            "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white",
          )}
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div>
          <p className="text-sm font-medium text-rose-400">Schritt 1 von 3</p>
          <h1 className="text-2xl font-black tracking-tight text-white">Dein Inserat</h1>
        </div>
      </div>

      <Card className="border-white/10 bg-zinc-900/70 text-white shadow-2xl shadow-black/20">
        <CardHeader className="border-b border-white/10 bg-white/[0.02]">
          <div className="flex size-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
            <UserRound className="size-5" />
          </div>

          <CardTitle className="mt-3">Stell dich kurz vor</CardTitle>

          <CardDescription className="leading-6 text-zinc-500">Diese Angaben sehen Besucher auf deinem Inserat.</CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <ModelProfileForm defaultDisplayName={user.profile?.displayName ?? user.name ?? user.username} defaultBio={user.profile?.bio ?? ""} defaultGender={user.profile?.gender ?? null} />
        </CardContent>
      </Card>
    </div>
  );
}
