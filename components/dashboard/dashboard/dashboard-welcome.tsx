import Link from "next/link";
import { ArrowRight, Eye, Heart, MessageCircle, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ProfileStats } from "@/lib/analytics/get-profile-stats";
import { cn } from "@/lib/utils";

type DashboardWelcomeProps = {
  displayName: string;
  username: string;
  stats: ProfileStats;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-CH").format(value);
}

function getMessage(stats: ProfileStats): string {
  if (stats.todayContacts > 0) {
    return `${formatNumber(stats.todayContacts)} ${stats.todayContacts === 1 ? "Person hat" : "Personen haben"} heute Kontakt mit dir aufgenommen.`;
  }

  if (stats.todayViews > 0) {
    return `${formatNumber(stats.todayViews)} ${stats.todayViews === 1 ? "Person hat" : "Personen haben"} heute dein Inserat angesehen.`;
  }

  if (stats.posts === 0) {
    return "Lade deine ersten Fotos hoch. Das erste wird automatisch dein Profilbild.";
  }

  return "Heute ist es noch ruhig. Neue Fotos oder ein Hochschieben bringen dein Inserat nach vorne.";
}

export function DashboardWelcome({ displayName, username, stats }: DashboardWelcomeProps) {
  return (
    <Card className="relative overflow-hidden border-rose-500/20 bg-gradient-to-br from-rose-500/15 via-zinc-900 to-zinc-950 text-white">
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-rose-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 size-64 rounded-full bg-violet-500/10 blur-3xl" />

      <CardContent className="relative p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-300">
              <Sparkles className="size-3.5" />
              Dein heutiger Überblick
            </div>

            <h2 className="max-w-2xl text-2xl font-black tracking-tight sm:text-3xl">Schön, dass du da bist, {displayName}.</h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300 sm:text-base">{getMessage(stats)}</p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/gallery" className={cn(buttonVariants(), "bg-rose-600 text-white hover:bg-rose-500")}>
                Bilder & Videos hochladen
                <ArrowRight className="size-4" />
              </Link>

              <Link
                href={`/profile/${username}`}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                  }),
                  "border-white/10 bg-white/5 text-white hover:bg-white/10",
                )}
              >
                Profil ansehen
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
              <Eye className="size-4 text-rose-400" />

              <p className="mt-3 text-xl font-black sm:text-2xl">{formatNumber(stats.todayViews)}</p>

              <p className="mt-1 truncate text-[11px] text-zinc-500 sm:text-xs">Aufrufe heute</p>
            </div>

            <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
              <MessageCircle className="size-4 text-emerald-400" />

              <p className="mt-3 text-xl font-black sm:text-2xl">{formatNumber(stats.todayContacts)}</p>

              <p className="mt-1 truncate text-[11px] text-zinc-500 sm:text-xs">Kontakte heute</p>
            </div>

            <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
              <Heart className="size-4 text-violet-400" />

              <p className="mt-3 text-xl font-black sm:text-2xl">{formatNumber(stats.followers)}</p>

              <p className="mt-1 truncate text-[11px] text-zinc-500 sm:text-xs">In Favoriten</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
