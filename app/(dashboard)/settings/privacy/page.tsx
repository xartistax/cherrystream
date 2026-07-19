import { ArrowLeft, Eye, EyeOff, Info, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { updateProfileVisibility } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function PrivacySettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const hasPublicProfile = session.user.role === "MODEL" || session.user.role === "ADMIN";

  const profile = hasPublicProfile
    ? await prisma.profile.findUnique({
        where: {
          userId: session.user.id,
        },
        select: {
          isPublic: true,
        },
      })
    : null;

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

        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Datenschutz</h1>

        <p className="mt-2 text-sm text-zinc-400 sm:text-base">Steuere, ob dein Profil öffentlich sichtbar ist.</p>
      </div>

      {!hasPublicProfile || !profile ? (
        <Card className="border-white/10 bg-white/[0.03]">
          <CardContent className="flex gap-4 p-5 sm:p-6">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-zinc-400">
              <Info className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold text-white">Kein öffentliches Profil</h2>

              <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                Sobald du dein Profil veröffentlicht hast, kannst du hier seine Sichtbarkeit verwalten.
              </p>

              <Link
                href="/become-model"
                className={cn(
                  buttonVariants({
                    size: "sm",
                  }),
                  "mt-4 bg-rose-600 text-white hover:bg-rose-500",
                )}
              >
                Profil veröffentlichen
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
                <LockKeyhole className="size-5" />
              </div>

              <div>
                <CardTitle className="text-lg text-white">Profilsichtbarkeit</CardTitle>

                <CardDescription className="mt-1 text-zinc-500">Diese Einstellung beeinflusst dein Profil und die Entdecken-Seite.</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <form action={updateProfileVisibility}>
              <input type="hidden" name="visibility" value="public" />

              <button
                type="submit"
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors",
                  profile.isPublic ? "border-rose-500/40 bg-rose-500/10" : "border-white/10 bg-black/10 hover:border-white/20 hover:bg-white/[0.03]",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    profile.isPublic ? "bg-rose-500 text-white" : "bg-white/5 text-zinc-500",
                  )}
                >
                  <Eye className="size-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-white">Öffentlich</span>
                  <span className="mt-1 block text-sm text-zinc-500">Dein Profil kann auf CherryStream gefunden und besucht werden.</span>
                </span>

                {profile.isPublic && <span className="text-xs font-medium text-rose-400">Aktiv</span>}
              </button>
            </form>

            <form action={updateProfileVisibility}>
              <input type="hidden" name="visibility" value="private" />

              <button
                type="submit"
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors",
                  !profile.isPublic ? "border-rose-500/40 bg-rose-500/10" : "border-white/10 bg-black/10 hover:border-white/20 hover:bg-white/[0.03]",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    !profile.isPublic ? "bg-rose-500 text-white" : "bg-white/5 text-zinc-500",
                  )}
                >
                  <EyeOff className="size-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-white">Privat</span>
                  <span className="mt-1 block text-sm text-zinc-500">Dein Profil wird nicht mehr öffentlich angezeigt.</span>
                </span>

                {!profile.isPublic && <span className="text-xs font-medium text-rose-400">Aktiv</span>}
              </button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
