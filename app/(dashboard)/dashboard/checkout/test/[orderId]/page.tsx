import { CircleCheck, CircleX, FlaskConical, Undo2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { resolveTestCheckoutAction } from "@/actions/credit-orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCreatorPage } from "@/lib/access";
import { getPaymentMode } from "@/lib/payments/config";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Testzahlung",
};

type TestCheckoutPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

/** Stands in for a provider's checkout while PAYMENTS_MODE=test, so the whole purchase can be tried without money. */
export default async function TestCheckoutPage({ params }: TestCheckoutPageProps) {
  const { userId } = await requireCreatorPage();

  if (getPaymentMode() !== "TEST") {
    notFound();
  }

  const { orderId } = await params;

  const order = await prisma.creditOrder.findFirst({
    where: {
      id: orderId,
      userId,
      provider: "TEST",
    },
    select: {
      id: true,
      credits: true,
      priceRappen: true,
      status: true,
    },
  });

  if (!order) {
    notFound();
  }

  if (order.status !== "PENDING") {
    redirect(`/dashboard/visibility?order=${order.id}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
        <FlaskConical className="mt-0.5 size-5 shrink-0 text-amber-300" />

        <p className="text-sm leading-6 text-amber-100/90">
          <strong className="text-amber-100">Testmodus:</strong> Hier wird keine echte Zahlung ausgeführt. Diese Seite ersetzt die Kasse eines
          Zahlungsanbieters, damit sich der Kauf durchspielen lässt.
        </p>
      </div>

      <Card className="border-white/10 bg-zinc-900/70 text-white">
        <CardHeader>
          <CardTitle>{order.credits.toLocaleString("de-CH")} Credits</CardTitle>

          <CardDescription className="text-zinc-400">Betrag: CHF {(order.priceRappen / 100).toFixed(2)}</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-3">
          <form action={resolveTestCheckoutAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="outcome" value="pay" />

            <Button type="submit" className="w-full bg-emerald-600 text-white hover:bg-emerald-500">
              <CircleCheck className="size-4" />
              Zahlung erfolgreich simulieren
            </Button>
          </form>

          <form action={resolveTestCheckoutAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="outcome" value="decline" />

            <Button type="submit" variant="outline" className="w-full border-white/10 bg-white/5 text-rose-300 hover:bg-white/10">
              <CircleX className="size-4" />
              Zahlung abgelehnt simulieren
            </Button>
          </form>

          <form action={resolveTestCheckoutAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="outcome" value="cancel" />

            <Button type="submit" variant="ghost" className="w-full text-zinc-400 hover:text-white">
              <Undo2 className="size-4" />
              Abbrechen
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
