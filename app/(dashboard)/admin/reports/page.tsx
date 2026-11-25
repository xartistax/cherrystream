import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { TriangleAlert } from "lucide-react";
import Link from "next/link";

import { setPostHiddenAction, setUserSuspendedAction } from "@/actions/admin/moderation";
import { closeReportAction } from "@/actions/admin/reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { reportReasonLabels, urgentReportReasons } from "@/lib/reports/reasons";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const [openReports, closedReports] = await Promise.all([
    prisma.report.findMany({
      where: {
        status: "OPEN",
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 100,
      select: {
        id: true,
        reason: true,
        details: true,
        createdAt: true,
        reporterHash: true,
        reportedUser: {
          select: {
            id: true,
            username: true,
            role: true,
            status: true,
            _count: {
              select: {
                reportsReceived: true,
              },
            },
          },
        },
        post: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    }),
    prisma.report.findMany({
      where: {
        status: {
          not: "OPEN",
        },
      },
      orderBy: {
        resolvedAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        status: true,
        reason: true,
        resolvedAt: true,
        resolutionNote: true,
        reportedUser: {
          select: {
            username: true,
          },
        },
        resolvedBy: {
          select: {
            username: true,
          },
        },
      },
    }),
  ]);

  // Urgent reasons first, then oldest first.
  const sortedReports = [...openReports].sort(
    (a, b) => Number(urgentReportReasons.includes(b.reason)) - Number(urgentReportReasons.includes(a.reason)) || a.createdAt.getTime() - b.createdAt.getTime(),
  );

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Offen ({openReports.length})</h2>

        {sortedReports.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-zinc-500">Keine offenen Meldungen.</p>
        ) : null}

        <div className="space-y-4">
          {sortedReports.map((report) => {
            const urgent = urgentReportReasons.includes(report.reason);
            const user = report.reportedUser;

            return (
              <Card key={report.id} className={cn("border-white/10 bg-zinc-900/70 text-white", urgent && "border-rose-500/40")}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className={cn("flex items-center gap-2 font-semibold", urgent && "text-rose-300")}>
                        {urgent ? <TriangleAlert className="size-4" /> : null}
                        {reportReasonLabels[report.reason]}
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        {report.post ? "Upload" : "Profil"} von{" "}
                        <Link href={`/profile/${user.username}`} target="_blank" className="text-zinc-300 hover:underline">
                          @{user.username}
                        </Link>{" "}
                        · {formatDistanceToNow(report.createdAt, { addSuffix: true, locale: de })} · {user._count.reportsReceived} Meldung(en) insgesamt ·
                        Melder {report.reporterHash.slice(0, 6)}
                      </p>
                    </div>

                    <span className="text-xs text-zinc-500">
                      Konto: {user.status === "ACTIVE" ? "aktiv" : user.status === "SUSPENDED" ? "gesperrt" : "gelöscht"}
                      {report.post ? ` · Upload: ${report.post.status === "HIDDEN" ? "ausgeblendet" : "sichtbar"}` : null}
                    </span>
                  </div>

                  {report.details ? <p className="rounded-xl bg-white/[0.03] p-3 text-sm leading-6 whitespace-pre-line text-zinc-300">{report.details}</p> : null}

                  <div className="flex flex-wrap gap-2">
                    {report.post && report.post.status === "PUBLISHED" ? (
                      <form action={setPostHiddenAction}>
                        <input type="hidden" name="postId" value={report.post.id} />
                        <input type="hidden" name="hide" value="true" />
                        <Button type="submit" variant="outline" size="sm" className="border-white/10 bg-white/5 text-rose-300">
                          Upload ausblenden
                        </Button>
                      </form>
                    ) : null}

                    {user.status === "ACTIVE" && user.role !== "ADMIN" ? (
                      <form action={setUserSuspendedAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="suspend" value="true" />
                        <Button type="submit" variant="outline" size="sm" className="border-white/10 bg-white/5 text-rose-300">
                          Konto sperren
                        </Button>
                      </form>
                    ) : null}
                  </div>

                  <form action={closeReportAction} className="flex flex-col gap-2 sm:flex-row">
                    <input type="hidden" name="reportId" value={report.id} />

                    <Input name="note" maxLength={500} placeholder="Notiz (optional)" className="border-white/10 bg-white/5 text-white" />

                    <div className="flex shrink-0 gap-2">
                      <Button type="submit" name="decision" value="RESOLVED" size="sm" className="bg-emerald-600 text-white hover:bg-emerald-500">
                        Erledigt
                      </Button>

                      <Button type="submit" name="decision" value="DISMISSED" variant="outline" size="sm" className="border-white/10 bg-white/5 text-white">
                        Verwerfen
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Zuletzt bearbeitet</h2>

        {closedReports.length === 0 ? (
          <p className="text-sm text-zinc-500">Noch keine bearbeiteten Meldungen.</p>
        ) : (
          <Card className="border-white/10 bg-zinc-900/70 text-white">
            <CardContent className="divide-y divide-white/5 p-0">
              {closedReports.map((report) => (
                <div key={report.id} className="px-5 py-3 text-sm">
                  <p>
                    <span className={report.status === "RESOLVED" ? "text-emerald-300" : "text-zinc-400"}>
                      {report.status === "RESOLVED" ? "Erledigt" : "Verworfen"}
                    </span>{" "}
                    · {reportReasonLabels[report.reason]} · @{report.reportedUser.username} · von @{report.resolvedBy?.username ?? "unbekannt"}
                    {report.resolvedAt ? ` · ${formatDistanceToNow(report.resolvedAt, { addSuffix: true, locale: de })}` : null}
                  </p>

                  {report.resolutionNote ? <p className="mt-1 text-zinc-500">{report.resolutionNote}</p> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
