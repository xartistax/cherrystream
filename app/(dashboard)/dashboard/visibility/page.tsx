import { Clock, Coins, ListOrdered, Repeat, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { BoostButton } from "@/components/boosts/boost-button";
import { WalletHistory } from "@/components/credits/wallet-history";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCreatorPage } from "@/lib/access";
import { getBoostStatus } from "@/lib/boosts/get-boost-status";
import { ECONOMY, type BoostOption } from "@/lib/economy";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Sichtbarkeit",
};

const dateTimeFormat = new Intl.DateTimeFormat("de-CH", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Zurich",
});

const timeFormat = new Intl.DateTimeFormat("de-CH", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Zurich",
});

const boostGroups: Array<{ type: BoostOption["type"]; title: string; description: string }> = [
  {
    type: "BUMP",
    title: "Hochschieben",
    description: `Dein Profil steht sofort zuoberst und rutscht nach unten, wenn andere nachziehen. Höchstens alle ${ECONOMY.bumpCooldownMinutes} Minuten.`,
  },
  {
    type: "AUTO_BUMP",
    title: "Auto-Hochschieben",
    description: "Wir schieben dein Profil in festen Abständen automatisch hoch. Günstiger als einzeln, und du musst nicht online sein.",
  },
  {
    type: "HIGHLIGHT",
    title: "Hervorhebung",
    description: "Deine Karte bekommt einen farbigen Rahmen und das Badge „Top“. Die Position in der Liste ändert sich dadurch nicht.",
  },
];

export default async function VisibilityPage() {
  const { userId, modelStatus } = await requireCreatorPage();

  const isPublished = modelStatus === "ACTIVE";

  const [status, transactions] = await Promise.all([
    getBoostStatus(userId),
    prisma.walletTransaction.findMany({
      where: {
        wallet: {
          userId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        type: true,
        balanceType: true,
        amountCredits: true,
        amountRappen: true,
        description: true,
        createdAt: true,
      },
    }),
  ]);

  const autoBumpHours = status.autoBumpIntervalMinutes ? status.autoBumpIntervalMinutes / 60 : null;

  function getNote(option: BoostOption): string | null {
    if (option.type === "HIGHLIGHT" && status.highlightUntil) {
      return `Deine laufende Hervorhebung wird verlängert (aktuell bis ${dateTimeFormat.format(status.highlightUntil)}).`;
    }

    if (option.type === "AUTO_BUMP" && status.autoBumpUntil) {
      return `Startet im Anschluss an dein laufendes Auto-Hochschieben (bis ${dateTimeFormat.format(status.autoBumpUntil)}).`;
    }

    return null;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Sichtbarkeit</h1>

        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Die Liste auf „Entdecken“ und der Startseite zeigt zuerst die Profile, die zuletzt hochgeschoben wurden. Mit Credits schiebst du dein Profil nach
          oben oder hebst es hervor.
        </p>
      </header>

      {!isPublished ? (
        <Link
          href="/dashboard/verification"
          className="flex items-start gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 transition hover:bg-amber-500/15"
        >
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-300" />

          <div>
            <p className="font-semibold text-amber-100">Boosts gibt es nach der Freischaltung</p>

            <p className="mt-1 text-sm leading-6 text-amber-100/70">Sobald dein Profil verifiziert und öffentlich ist, steht es automatisch einmal ganz oben.</p>
          </div>
        </Link>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard icon={Coins} title="Guthaben" value={`${status.credits.toLocaleString("de-CH")} Credits`} />

        <StatusCard
          icon={ListOrdered}
          title="Dein Platz"
          value={status.position ? `Platz ${status.position}` : "Nicht gelistet"}
          detail={status.bumpedAt ? `Zuletzt oben: ${dateTimeFormat.format(status.bumpedAt)}` : null}
        />

        <StatusCard
          icon={Repeat}
          title="Auto-Hochschieben"
          value={status.autoBumpUntil ? `Bis ${dateTimeFormat.format(status.autoBumpUntil)}` : "Inaktiv"}
          detail={autoBumpHours ? `Alle ${autoBumpHours} Stunden` : null}
        />

        <StatusCard
          icon={Sparkles}
          title="Hervorhebung"
          value={status.highlightUntil ? `Bis ${dateTimeFormat.format(status.highlightUntil)}` : "Inaktiv"}
        />
      </div>

      {boostGroups.map((group) => (
        <section key={group.type} className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">{group.title}</h2>

            <p className="mt-1 max-w-2xl text-sm text-zinc-500">{group.description}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ECONOMY.boostOptions
              .filter((option) => option.type === group.type)
              .map((option) => (
                <Card key={option.id} className="border-white/10 bg-zinc-900/60 text-white">
                  <CardHeader>
                    <CardTitle className="text-base">{option.label}</CardTitle>

                    <CardDescription className="text-zinc-500">{option.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <BoostButton
                      option={option}
                      balance={status.credits}
                      note={getNote(option)}
                      blockedReason={
                        !isPublished
                          ? "Erst nach der Freischaltung"
                          : option.type === "BUMP" && status.nextBumpAt
                            ? `Wieder möglich ab ${timeFormat.format(status.nextBumpAt)} Uhr`
                            : null
                      }
                    />
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>
      ))}

      <section className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <Clock className="mt-0.5 size-5 shrink-0 text-zinc-500" />

        <p className="text-sm leading-6 text-zinc-400">Credits kannst du bald direkt hier kaufen.</p>
      </section>

      <WalletHistory transactions={transactions} />
    </div>
  );
}

type StatusCardProps = {
  icon: typeof Coins;
  title: string;
  value: string;
  detail?: string | null;
};

function StatusCard({ icon: Icon, title, value, detail }: StatusCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <Icon className="size-4 text-rose-400" />
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-xl font-bold text-white">{value}</p>

        {detail ? <p className="mt-1 text-xs text-zinc-500">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}
