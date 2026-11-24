import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowLeft, BadgeCheck, Clock, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VerificationForm } from "@/components/verification/verification-form";
import { requireCreatorPage } from "@/lib/access";
import { cn } from "@/lib/utils";
import { getVerificationOverview } from "@/lib/verification/get-verification-overview";

export const metadata = {
  title: "Verifizierung",
};

export default async function VerificationPage() {
  const { userId, role, modelStatus } = await requireCreatorPage();

  const overview = role === "ADMIN" ? ({ state: "VERIFIED" } as const) : await getVerificationOverview(userId, modelStatus);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <Link
        href="/dashboard"
        className={cn(
          buttonVariants({
            variant: "ghost",
          }),
          "-ml-4",
        )}
      >
        <ArrowLeft className="mr-2 size-4" />
        Dashboard
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white">Verifizierung</h1>

        <p className="mt-2 text-zinc-400">
          Damit nur volljährige, echte Personen auf CherryStream sichtbar sind, prüfen wir jedes Profil, bevor es veröffentlicht wird.
        </p>
      </div>

      <Card className="border-white/10 bg-zinc-900/70 text-white">
        <CardContent className="p-6">
          {overview.state === "VERIFIED" ? (
            <div className="flex items-start gap-4">
              <BadgeCheck className="mt-0.5 size-6 shrink-0 text-sky-400" />

              <div>
                <p className="font-semibold">Dein Profil ist verifiziert</p>

                <p className="mt-1 text-sm leading-6 text-zinc-400">Dein Profil ist öffentlich sichtbar und du kannst Inhalte veröffentlichen.</p>
              </div>
            </div>
          ) : null}

          {overview.state === "IN_REVIEW" ? (
            <div className="flex items-start gap-4">
              <Clock className="mt-0.5 size-6 shrink-0 text-amber-400" />

              <div>
                <p className="font-semibold">Deine Dokumente werden geprüft</p>

                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Eingereicht am {format(overview.submittedAt, "d. MMMM yyyy, HH:mm", { locale: de })} Uhr. Sobald dein Profil freigegeben ist, wird es
                  öffentlich sichtbar. In der Zwischenzeit kannst du dein Profil bereits vervollständigen.
                </p>

                <Link href="/profile/edit" className={cn(buttonVariants({ variant: "outline" }), "mt-4 border-white/10 bg-white/5")}>
                  Profil bearbeiten
                </Link>
              </div>
            </div>
          ) : null}

          {overview.state === "REQUIRED" ? (
            <div className="space-y-6">
              {overview.rejectionReason ? (
                <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
                  <ShieldAlert className="mt-0.5 size-5 shrink-0 text-rose-400" />

                  <div>
                    <p className="text-sm font-semibold text-rose-200">Deine letzte Einreichung wurde abgelehnt</p>

                    <p className="mt-1 text-sm leading-6 text-rose-200/80">{overview.rejectionReason}</p>
                  </div>
                </div>
              ) : null}

              <VerificationForm challengeCode={overview.challengeCode} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
