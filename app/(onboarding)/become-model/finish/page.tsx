import { ArrowLeft, CheckCircle2, MapPin, Rocket, Tags, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { completeModelOnboardingAction } from "@/actions/complete-model-onboarding";

export const metadata = {
  title: "Inserat abschliessen",
};

export default async function BecomeModelFinishPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
      username: true,
      profile: {
        select: {
          displayName: true,
          bio: true,
          cantonId: true,
          cityId: true,
          canton: {
            select: {
              name: true,
            },
          },
          city: {
            select: {
              name: true,
            },
          },
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.role === "MODEL" || user.role === "ADMIN") {
    redirect("/dashboard");
  }

  if (!user.profile?.displayName) {
    redirect("/become-model/profile");
  }

  if (!user.profile.cantonId || !user.profile.cityId) {
    redirect("/become-model/location");
  }

  if (user.profile.categories.length === 0) {
    redirect("/become-model/categories");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8 sm:py-12">
      <header className="flex items-center gap-4">
        <Link
          href="/become-model/categories"
          aria-label="Zurück zu den Rubriken"
          className={cn(
            buttonVariants({
              variant: "outline",
              size: "icon",
            }),
            "shrink-0 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white",
          )}
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div>
          <p className="text-sm font-medium text-rose-400">Letzter Schritt</p>

          <h1 className="text-2xl font-black tracking-tight text-white">Du bist bereit</h1>
        </div>
      </header>

      <Card className="overflow-hidden border-white/10 bg-zinc-900/70 text-white shadow-2xl shadow-black/20">
        <CardHeader className="items-center border-b border-white/10 bg-white/[0.02] px-6 py-10 text-center sm:px-10">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Rocket className="size-7" />
          </div>

          <CardTitle className="mt-4 text-3xl font-black tracking-tight">Dein Inserat ist vorbereitet</CardTitle>

          <CardDescription className="max-w-lg text-base leading-7 text-zinc-400">
            Prüfe deine Angaben. Danach verifizierst du dein Alter mit einem Ausweis, und wir schalten dein Inserat frei. Der Ausweis dient nur der Prüfung und wird danach gelöscht.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 p-6 sm:p-10">
          <div className="space-y-3">
            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                <UserRound className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">Inserat</p>

                  <CheckCircle2 className="size-5 text-emerald-400" />
                </div>

                <p className="mt-1 truncate text-sm text-zinc-400">{user.profile.displayName}</p>

                <p className="mt-1 text-xs text-zinc-600">@{user.username}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                <MapPin className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">Standort</p>

                  <CheckCircle2 className="size-5 text-emerald-400" />
                </div>

                <p className="mt-1 text-sm text-zinc-400">
                  {user.profile.city?.name}, {user.profile.canton?.name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <Tags className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">Rubriken</p>

                  <CheckCircle2 className="size-5 text-emerald-400" />
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {user.profile.categories.map(({ category }) => (
                    <span key={category.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <form action={completeModelOnboardingAction}>
            <button type="submit" className={cn(buttonVariants(), "w-full bg-rose-600 text-white hover:bg-rose-500")}>
              <Rocket className="size-4" />
              Weiter zur Verifizierung
            </button>
          </form>

          <p className="text-center text-xs leading-5 text-zinc-600">Du kannst alle Angaben später jederzeit unter «Inserat bearbeiten» ändern.</p>
        </CardContent>
      </Card>
    </div>
  );
}
