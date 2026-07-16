import { Eye, MessageCircle, Percent, UsersRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileStats } from "@/lib/analytics/get-profile-stats";
import { cn } from "@/lib/utils";

type BusinessMetricsProps = {
  stats: ProfileStats;
};

type MetricCardProps = {
  label: string;
  value: string;
  description: string;
  icon: typeof Eye;
  iconClassName: string;
  featured?: boolean;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-CH").format(value);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)} %`;
}

function MetricCard({ label, value, description, icon: Icon, iconClassName, featured = false }: MetricCardProps) {
  return (
    <Card
      className={cn(
        "border-white/10 bg-zinc-900/60 text-white",
        featured && "border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-zinc-900/70 to-zinc-900/60",
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-zinc-500">{label}</span>

          <div className={cn("flex size-9 items-center justify-center rounded-xl bg-white/5", iconClassName)}>
            <Icon className="size-4" />
          </div>
        </div>

        <p className="mt-4 text-3xl font-black tracking-tight">{value}</p>

        <p className="mt-1 text-xs leading-5 text-zinc-600">{description}</p>
      </CardContent>
    </Card>
  );
}

export function BusinessMetrics({ stats }: BusinessMetricsProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Dein Geschäft heute</h2>

        <p className="mt-1 text-sm text-zinc-500">Die wichtigsten Kennzahlen für Reichweite und Kontakte.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Profilaufrufe"
          value={formatNumber(stats.todayViews)}
          description={`${formatNumber(stats.weekViews)} diese Woche`}
          icon={Eye}
          iconClassName="text-rose-400"
          featured
        />

        <MetricCard
          label="Kontaktaufnahmen"
          value={formatNumber(stats.todayContacts)}
          description={`${formatNumber(stats.weekContacts)} diese Woche`}
          icon={MessageCircle}
          iconClassName="text-emerald-400"
          featured
        />

        <MetricCard
          label="Kontakt-Conversion"
          value={formatPercentage(stats.todayConversionRate)}
          description={`${formatPercentage(stats.weekConversionRate)} diese Woche`}
          icon={Percent}
          iconClassName="text-amber-400"
        />

        <MetricCard
          label="Follower"
          value={formatNumber(stats.followers)}
          description={`${formatNumber(stats.posts)} veröffentlichte Inhalte`}
          icon={UsersRound}
          iconClassName="text-violet-400"
        />
      </div>

      <Card className="border-white/10 bg-zinc-900/60 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Gesamtleistung</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-zinc-500">Profilaufrufe gesamt</p>

            <p className="mt-2 text-2xl font-black">{formatNumber(stats.totalViews)}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-zinc-500">Kontaktaufnahmen gesamt</p>

            <p className="mt-2 text-2xl font-black">{formatNumber(stats.totalContacts)}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-zinc-500">Kontakt-Conversion gesamt</p>

            <p className="mt-2 text-2xl font-black">{formatPercentage(stats.totalConversionRate)}</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
