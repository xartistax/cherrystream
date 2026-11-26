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

export default async function AdminOrdersPage() {
  const [orders, liveRevenue] = await Promise.all([
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
    // Test orders never count as revenue.
    prisma.creditOrder.aggregate({
      where: {
        mode: "LIVE",
        status: "PAID",
      },
      _sum: {
        priceRappen: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Bestellungen</h2>

          <p className="mt-1 text-sm text-zinc-500">Credit-Käufe der Models, die letzten 100. Testzahlungen zählen nicht zum Umsatz.</p>
        </div>

        <p className="text-sm text-zinc-400">
          Umsatz (live): <strong className="text-white">CHF {((liveRevenue._sum.priceRappen ?? 0) / 100).toFixed(2)}</strong>
        </p>
      </div>

      <Card className="border-white/10 bg-zinc-900/70 text-white">
        <CardContent className="divide-y divide-white/10 p-0">
          {orders.length === 0 ? <p className="p-6 text-sm text-zinc-500">Noch keine Bestellungen.</p> : null}

          {orders.map((order) => (
            <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
              <div className="min-w-0">
                <p className="font-medium">
                  @{order.user.username} · {order.credits.toLocaleString("de-CH")} Credits · CHF {(order.priceRappen / 100).toFixed(2)}
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
  );
}
