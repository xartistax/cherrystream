import { Card, CardContent } from "@/components/ui/card";
import type { CreditOrderStatus } from "@/generated/prisma/enums";
import { paymentProviderLabels } from "@/lib/payments/config";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusLabels: Record<CreditOrderStatus, string> = {
  PENDING: "offen",
  PAID: "bezahlt",
  FAILED: "abgelehnt",
  CANCELLED: "abgebrochen",
  EXPIRED: "abgelaufen",
};

const statusStyles: Record<CreditOrderStatus, string> = {
  PENDING: "text-amber-300",
  PAID: "text-emerald-300",
  FAILED: "text-rose-300",
  CANCELLED: "text-zinc-500",
  EXPIRED: "text-zinc-500",
};

const dateTimeFormat = new Intl.DateTimeFormat("de-CH", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Zurich",
});

const monthFormat = new Intl.DateTimeFormat("de-CH", {
  month: "long",
  year: "numeric",
  timeZone: "Europe/Zurich",
});

function chf(rappen: number): string {
  return `CHF ${(rappen / 100).toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "2026-11" in Swiss time, the key the monthly table and the grouped list share. */
function monthKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: "Europe/Zurich" }).format(date);
}

function monthLabel(key: string): string {
  return monthFormat.format(new Date(`${key}-15T12:00:00Z`));
}

type MonthRow = {
  month: string;
  orders: number;
  credits: number;
  revenue: number;
  testOrders: number;
};

export default async function AdminOrdersPage() {
  const [orders, months] = await Promise.all([
    prisma.creditOrder.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      select: {
        id: true,
        credits: true,
        priceRappen: true,
        provider: true,
        mode: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    }),
    // Paid orders per month (Swiss time) over the last 24 months; revenue only from live payments.
    prisma.$queryRaw<Array<{ month: string; orders: bigint; credits: bigint; revenue: bigint; test_orders: bigint }>>`
      SELECT
        to_char(("paidAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Zurich', 'YYYY-MM') AS month,
        COUNT(*) FILTER (WHERE "mode" = 'LIVE') AS orders,
        COALESCE(SUM("credits") FILTER (WHERE "mode" = 'LIVE'), 0) AS credits,
        COALESCE(SUM("priceRappen") FILTER (WHERE "mode" = 'LIVE'), 0) AS revenue,
        COUNT(*) FILTER (WHERE "mode" = 'TEST') AS test_orders
      FROM "CreditOrder"
      WHERE "status" = 'PAID' AND "paidAt" >= now() - interval '24 months'
      GROUP BY 1
      ORDER BY 1 DESC
    `,
  ]);

  const monthRows: MonthRow[] = months.map((row) => ({
    month: row.month,
    orders: Number(row.orders),
    credits: Number(row.credits),
    revenue: Number(row.revenue),
    testOrders: Number(row.test_orders),
  }));

  const currentMonth = monthKey(new Date());
  const previousMonth = monthKey(new Date(new Date(`${currentMonth}-15T12:00:00Z`).getTime() - 31 * 24 * 60 * 60 * 1000));
  const revenueOf = (key: string) => monthRows.find((row) => row.month === key)?.revenue ?? 0;
  const totalRevenue = monthRows.reduce((sum, row) => sum + row.revenue, 0);

  const ordersByMonth = new Map<string, typeof orders>();

  for (const order of orders) {
    const key = monthKey(order.createdAt);
    ordersByMonth.set(key, [...(ordersByMonth.get(key) ?? []), order]);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Bestellungen und Umsatz</h2>

        <p className="mt-1 text-sm text-zinc-500">Credit-Käufe der Models. Umsatz zählt nur echte Zahlungen, Testzahlungen sind separat ausgewiesen.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: `Umsatz ${monthLabel(currentMonth)}`, value: chf(revenueOf(currentMonth)) },
          { label: `Umsatz ${monthLabel(previousMonth)}`, value: chf(revenueOf(previousMonth)) },
          { label: "Umsatz letzte 24 Monate", value: chf(totalRevenue) },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-white/10 bg-white/[0.03] text-white">
            <CardContent className="p-5">
              <p className="text-sm text-zinc-500">{kpi.label}</p>
              <p className="mt-1 text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <h3 className="font-semibold text-white">Pro Monat</h3>

        <Card className="border-white/10 bg-zinc-900/70 text-white">
          <CardContent className="overflow-x-auto p-0">
            {monthRows.length === 0 ? (
              <p className="p-6 text-sm text-zinc-500">Noch keine bezahlten Bestellungen.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-zinc-500">
                  <tr className="border-b border-white/10">
                    <th className="px-5 py-3 font-medium">Monat</th>
                    <th className="px-5 py-3 text-right font-medium">Käufe</th>
                    <th className="px-5 py-3 text-right font-medium">Credits</th>
                    <th className="px-5 py-3 text-right font-medium">Ø pro Kauf</th>
                    <th className="px-5 py-3 text-right font-medium">Umsatz</th>
                    <th className="px-5 py-3 text-right font-medium">Testzahlungen</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {monthRows.map((row) => (
                    <tr key={row.month}>
                      <td className="px-5 py-3 font-medium">{monthLabel(row.month)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{row.orders}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{row.credits.toLocaleString("de-CH")}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-zinc-400">{row.orders > 0 ? chf(Math.round(row.revenue / row.orders)) : "–"}</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">{chf(row.revenue)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-zinc-500">{row.testOrders}</td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="border-t border-white/10 text-zinc-300">
                  <tr>
                    <td className="px-5 py-3 font-medium">Total</td>
                    <td className="px-5 py-3 text-right tabular-nums">{monthRows.reduce((sum, row) => sum + row.orders, 0)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{monthRows.reduce((sum, row) => sum + row.credits, 0).toLocaleString("de-CH")}</td>
                    <td />
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">{chf(totalRevenue)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-zinc-500">{monthRows.reduce((sum, row) => sum + row.testOrders, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-white">Alle Bestellungen (die letzten 100)</h3>

        {orders.length === 0 ? <p className="text-sm text-zinc-500">Noch keine Bestellungen.</p> : null}

        {[...ordersByMonth.entries()].map(([month, monthOrders]) => (
          <div key={month} className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{monthLabel(month)}</p>

            <Card className="border-white/10 bg-zinc-900/70 text-white">
              <CardContent className="divide-y divide-white/10 p-0">
                {monthOrders.map((order) => (
                  <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">
                        @{order.user.username} · {order.credits.toLocaleString("de-CH")} Credits · {chf(order.priceRappen)}
                      </p>

                      <p className="mt-0.5 text-zinc-500">
                        {dateTimeFormat.format(order.createdAt)} · {paymentProviderLabels[order.provider]}
                        {order.mode === "TEST" ? <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-300">Test</span> : null}
                      </p>
                    </div>

                    <span className={cn("font-medium", statusStyles[order.status])}>{statusLabels[order.status]}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </section>
    </div>
  );
}
