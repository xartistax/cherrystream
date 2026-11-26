import "server-only";

import { sendAdminAlert } from "@/lib/admin-alerts/alerts";
import type { CleanupResult } from "@/lib/cleanup";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

const dateFormat = new Intl.DateTimeFormat("de-CH", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Zurich",
});

function chf(rappen: number): string {
  return `CHF ${(rappen / 100).toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Start of the current month in Swiss time, as a UTC instant. */
function startOfZurichMonth(now: Date): Date {
  const [year, month] = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: "Europe/Zurich" }).format(now).split("-");
  const guess = new Date(`${year}-${month}-01T00:00:00Z`);
  // Zurich is UTC+1 or UTC+2; shift by the offset that applies on the first of the month.
  const offsetHours = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: "Europe/Zurich" }).format(guess));

  return new Date(guess.getTime() - offsetHours * 60 * 60 * 1000);
}

/**
 * Runs with the daily cron (after the cleanup): problems first, then the reminder for waiting verifications,
 * then the summary of the last 24 hours. Each message respects its switch under Admin → Telegram.
 */
export async function runDailyAlerts(cleanup: CleanupResult | null, cleanupError: unknown): Promise<void> {
  const now = new Date();
  const since = new Date(now.getTime() - DAY_MS);

  if (cleanupError || (cleanup && !cleanup.verificationDocumentsPurged)) {
    await sendAdminAlert("SYSTEM_PROBLEM", {
      title: "Täglicher Cleanup fehlgeschlagen",
      lines: [
        cleanupError
          ? `Fehler: ${cleanupError instanceof Error ? cleanupError.message : "unbekannt"}`
          : "Ausweisdokumente konnten nicht gelöscht werden, sie bleiben bis zum nächsten Lauf gespeichert",
      ],
      path: "/admin",
    });
  }

  try {
    // Loaded on demand inside the try: a problem in the status checks must not stop the other daily messages.
    const { getSystemStatus } = await import("@/lib/admin/system-status");
    const failing = (await getSystemStatus()).flatMap((group) => group.checks).filter((check) => check.status === "error");

    if (failing.length > 0) {
      await sendAdminAlert("SYSTEM_PROBLEM", {
        title: "Statusseite meldet Fehler",
        lines: failing.map((check) => `${check.label}: ${check.detail}`),
        path: "/admin",
      });
    }
  } catch (error) {
    console.error("Daily status check failed:", error);
  }

  const [overdue, oldestOverdue] = await Promise.all([
    prisma.modelVerification.count({ where: { status: "PENDING", submittedAt: { lt: since } } }),
    prisma.modelVerification.findFirst({ where: { status: "PENDING" }, orderBy: { submittedAt: "asc" }, select: { submittedAt: true } }),
  ]);

  if (overdue > 0 && oldestOverdue) {
    const days = Math.floor((now.getTime() - oldestOverdue.submittedAt.getTime()) / DAY_MS);

    await sendAdminAlert("VERIFICATION_OVERDUE", {
      lines: [`${overdue} Verifizierung${overdue === 1 ? "" : "en"} seit über 24 Stunden offen, die älteste seit ${days} Tag${days === 1 ? "" : "en"}`],
      path: "/admin/verifications",
    });
  }

  const monthStart = startOfZurichMonth(now);

  const [
    newAccounts,
    submitted,
    approved,
    rejected,
    pendingVerifications,
    newReports,
    openReports,
    claimed,
    declined,
    boosts,
    livePaid,
    testPaid,
    monthRevenue,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.modelVerification.count({ where: { submittedAt: { gte: since } } }),
    prisma.modelVerification.count({ where: { status: "APPROVED", reviewedAt: { gte: since } } }),
    prisma.modelVerification.count({ where: { status: "REJECTED", reviewedAt: { gte: since } } }),
    prisma.modelVerification.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { createdAt: { gte: since } } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.modelInvite.count({ where: { claimedAt: { gte: since } } }),
    prisma.declinedContact.count({ where: { declinedAt: { gte: since } } }),
    prisma.boost.aggregate({ where: { createdAt: { gte: since } }, _count: true, _sum: { credits: true } }),
    prisma.creditOrder.aggregate({ where: { mode: "LIVE", status: "PAID", paidAt: { gte: since } }, _count: true, _sum: { priceRappen: true } }),
    prisma.creditOrder.count({ where: { mode: "TEST", status: "PAID", paidAt: { gte: since } } }),
    prisma.creditOrder.aggregate({ where: { mode: "LIVE", status: "PAID", paidAt: { gte: monthStart } }, _sum: { priceRappen: true } }),
  ]);

  await sendAdminAlert("DAILY_SUMMARY", {
    title: `Tageszusammenfassung, ${dateFormat.format(now)}`,
    lines: [
      `Neue Konten: ${newAccounts}`,
      `Verifizierungen: ${submitted} eingereicht, ${approved} freigeschaltet, ${rejected} abgelehnt (${pendingVerifications} offen)`,
      `Meldungen: ${newReports} neu (${openReports} offen)`,
      `Einladungen: ${claimed} übernommen, ${declined} abgelehnt`,
      `Boosts: ${boosts._count} gebucht, ${(boosts._sum.credits ?? 0).toLocaleString("de-CH")} Credits`,
      `Umsatz: ${chf(livePaid._sum.priceRappen ?? 0)} aus ${livePaid._count} ${livePaid._count === 1 ? "Kauf" : "Käufen"}${testPaid > 0 ? ` (dazu ${testPaid} ${testPaid === 1 ? "Testzahlung" : "Testzahlungen"})` : ""}`,
      `Umsatz diesen Monat: ${chf(monthRevenue._sum.priceRappen ?? 0)}`,
    ],
    path: "/admin",
  });
}
