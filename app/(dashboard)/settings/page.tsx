import { Bell, ChevronRight, LockKeyhole, ShieldCheck, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const settings = [
  {
    title: "Konto & Sicherheit",
    description: "E-Mail-Adresse und Passwort verwalten.",
    href: "/settings/account",
    icon: ShieldCheck,
    available: true,
  },
  {
    title: "Benachrichtigungen",
    description: "Lege fest, wie wir dich informieren dürfen.",
    href: "/settings/notifications",
    icon: Bell,
    available: true,
  },
  {
    title: "Datenschutz",
    description: "Steuere die Sichtbarkeit deines öffentlichen Profils.",
    href: "/settings/privacy",
    icon: LockKeyhole,
    available: true,
  },
] as const;

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Einstellungen</h1>

        <p className="mt-2 text-sm text-zinc-400 sm:text-base">Verwalte dein Konto, deine Sicherheit und deine Privatsphäre.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {settings.map((item) => {
          const Icon = item.icon;

          const card = (
            <Card
              className={
                item.available
                  ? "h-full border-white/10 bg-white/[0.03] transition-colors hover:border-white/20 hover:bg-white/[0.05]"
                  : "h-full border-white/10 bg-white/[0.03]"
              }
            >
              <CardHeader className="flex-row items-start gap-4 space-y-0">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
                  <Icon className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base text-white">{item.title}</CardTitle>

                    {item.available ? (
                      <ChevronRight className="size-5 text-zinc-600" />
                    ) : (
                      <Badge variant="secondary" className="border-white/10 bg-white/5 text-zinc-500">
                        Demnächst
                      </Badge>
                    )}
                  </div>

                  <CardDescription className="mt-2 leading-relaxed text-zinc-500">{item.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          );

          return item.available ? (
            <Link key={item.href} href={item.href} className="block">
              {card}
            </Link>
          ) : (
            <div key={item.href}>{card}</div>
          );
        })}
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Gefahrenzone</h2>
          <p className="mt-1 text-sm text-zinc-500">Aktionen in diesem Bereich können nicht einfach rückgängig gemacht werden.</p>
        </div>

        <Link href="/settings/danger">
          <Card className="border-rose-500/20 bg-rose-500/[0.04]">
            <CardContent className="flex items-center gap-4 p-5 sm:p-6">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
                <TriangleAlert className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white">Konto löschen</h3>
                <p className="mt-1 text-sm text-zinc-500">Lösche dein Konto und alle damit verbundenen Daten dauerhaft.</p>
              </div>

              <ChevronRight className="size-5 shrink-0 text-zinc-700" />
            </CardContent>
          </Card>
        </Link>
      </section>
    </div>
  );
}
