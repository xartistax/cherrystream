import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  const [pending, recent] = await Promise.all([
    prisma.modelVerification.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: {
        submittedAt: "asc",
      },
      select: {
        id: true,
        submittedAt: true,
        user: {
          select: {
            username: true,
            email: true,
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    }),
    prisma.modelVerification.findMany({
      where: {
        status: {
          not: "PENDING",
        },
      },
      orderBy: {
        reviewedAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        status: true,
        reviewedAt: true,
        rejectionReason: true,
        user: {
          select: {
            username: true,
          },
        },
        reviewedBy: {
          select: {
            username: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Offen ({pending.length})</h2>

        {pending.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-zinc-500">Keine offenen Verifizierungen.</p>
        ) : (
          <Card className="border-white/10 bg-zinc-900/70 text-white">
            <CardContent className="divide-y divide-white/5 p-0">
              {pending.map((verification) => (
                <Link
                  key={verification.id}
                  href={`/admin/verifications/${verification.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {verification.user.profile?.displayName ?? verification.user.username}{" "}
                      <span className="text-zinc-500">@{verification.user.username}</span>
                    </p>

                    <p className="mt-0.5 truncate text-sm text-zinc-500">
                      {verification.user.email} · eingereicht {formatDistanceToNow(verification.submittedAt, { addSuffix: true, locale: de })}
                    </p>
                  </div>

                  <ChevronRight className="size-4 shrink-0 text-zinc-500" />
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Zuletzt bearbeitet</h2>

        {recent.length === 0 ? (
          <p className="text-sm text-zinc-500">Noch keine bearbeiteten Verifizierungen.</p>
        ) : (
          <Card className="border-white/10 bg-zinc-900/70 text-white">
            <CardContent className="divide-y divide-white/5 p-0">
              {recent.map((verification) => (
                <div key={verification.id} className="px-5 py-3 text-sm">
                  <p>
                    <span className={verification.status === "APPROVED" ? "text-emerald-300" : "text-rose-300"}>
                      {verification.status === "APPROVED" ? "Freigegeben" : "Abgelehnt"}
                    </span>{" "}
                    · @{verification.user.username} · von @{verification.reviewedBy?.username ?? "unbekannt"}
                    {verification.reviewedAt ? ` · ${formatDistanceToNow(verification.reviewedAt, { addSuffix: true, locale: de })}` : null}
                  </p>

                  {verification.rejectionReason ? <p className="mt-1 text-zinc-500">{verification.rejectionReason}</p> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
