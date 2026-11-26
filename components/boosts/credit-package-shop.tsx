"use client";

import { Coins, FlaskConical, LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createCreditOrderAction, type CreditOrderActionResult } from "@/actions/credit-orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CreditPackageShopProps = {
  testMode: boolean;
  packages: Array<{
    id: string;
    credits: number;
    bonusCredits: number;
    priceRappen: number;
  }>;
};

const initialState: CreditOrderActionResult = {
  success: false,
};

export function CreditPackageShop({ testMode, packages }: CreditPackageShopProps) {
  const [state, formAction] = useActionState(createCreditOrderAction, initialState);

  return (
    <div className="space-y-4">
      {testMode ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <FlaskConical className="mt-0.5 size-5 shrink-0 text-amber-300" />

          <p className="text-sm leading-6 text-amber-100/90">
            <strong className="text-amber-100">Testmodus:</strong> keine echten Zahlungen. Gekaufte Credits sind als Testzahlung markiert.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {packages.map((creditPackage) => (
          <Card key={creditPackage.id} className="border-white/10 bg-zinc-900/60 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Coins className="size-5 text-amber-400" />
                {creditPackage.credits.toLocaleString("de-CH")} Credits
              </CardTitle>

              <p className="text-sm text-zinc-500">
                {creditPackage.bonusCredits > 0 ? `inkl. ${creditPackage.bonusCredits.toLocaleString("de-CH")} Bonus-Credits` : "Startpaket"}
              </p>
            </CardHeader>

            <CardContent>
              <form action={formAction}>
                <input type="hidden" name="packageId" value={creditPackage.id} />

                <BuyButton priceRappen={creditPackage.priceRappen} />
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      {state.message ? (
        <p role="alert" className="text-sm text-rose-300">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

function BuyButton({ priceRappen }: { priceRappen: number }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full bg-rose-600 text-white hover:bg-rose-500">
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      CHF {(priceRappen / 100).toFixed(2)}
    </Button>
  );
}
