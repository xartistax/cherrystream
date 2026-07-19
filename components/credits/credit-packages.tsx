"use client";

import { useState } from "react";
import { Coins, Loader2 } from "lucide-react";

import type { CreditPackageId } from "@/lib/economy";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CreditPackage = {
  id: CreditPackageId;
  paidCredits: number;
  bonusCredits: number;
  priceRappen: number;
};

type CreditPackagesProps = {
  packages: readonly CreditPackage[];
};

export function CreditPackages({ packages }: CreditPackagesProps) {
  const [pendingPackageId, setPendingPackageId] = useState<CreditPackageId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(packageId: CreditPackageId) {
    setPendingPackageId(packageId);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packageId }),
      });

      const data: unknown = await response.json();

      if (!response.ok || typeof data !== "object" || data === null || !("url" in data) || typeof data.url !== "string") {
        throw new Error("Checkout konnte nicht gestartet werden.");
      }

      window.location.assign(data.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout konnte nicht gestartet werden.");
      setPendingPackageId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white">Credits kaufen</h2>
        <p className="mt-1 text-sm text-zinc-400">Bezahle sicher über Stripe.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((creditPackage) => {
          const totalCredits = creditPackage.paidCredits + creditPackage.bonusCredits;
          const isPending = pendingPackageId === creditPackage.id;
          const isDisabled = pendingPackageId !== null;

          return (
            <Card key={creditPackage.id} className="flex flex-col border-white/10 bg-white/[0.03]">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Coins className="size-5 text-rose-400" />
                    {totalCredits.toLocaleString("de-CH")} Credits
                  </CardTitle>

                  {creditPackage.bonusCredits > 0 && (
                    <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400">
                      +{creditPackage.bonusCredits.toLocaleString("de-CH")} Bonus
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col">
                <div className="space-y-2">
                  <p className="text-3xl font-bold tracking-tight text-white">
                    CHF{" "}
                    {(creditPackage.priceRappen / 100).toLocaleString("de-CH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>

                  <div className="min-h-10 text-sm text-zinc-400">
                    {creditPackage.bonusCredits > 0 ? (
                      <>
                        {creditPackage.paidCredits.toLocaleString("de-CH")} Credits gekauft
                        <br />+{creditPackage.bonusCredits.toLocaleString("de-CH")} Bonus Credits
                      </>
                    ) : (
                      <span className="opacity-0">Placeholder</span>
                    )}
                  </div>
                </div>

                <Button className="mt-3 w-full" disabled={isDisabled} onClick={() => handleCheckout(creditPackage.id)}>
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Weiter zu Stripe
                    </>
                  ) : (
                    "Credits kaufen"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
