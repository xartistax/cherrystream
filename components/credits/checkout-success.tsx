"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

type CheckoutStatus =
  | {
      status: "pending";
    }
  | {
      status: "completed";
      totalCredits: number;
      paidCredits: number | null;
      bonusCredits: number | null;
    };

type CheckoutSuccessProps = {
  sessionId: string;
};

export function CheckoutSuccess({ sessionId }: CheckoutSuccessProps) {
  const router = useRouter();
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>({
    status: "pending",
  });

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function loadStatus() {
      try {
        const response = await fetch(`/api/stripe/checkout-status?session_id=${encodeURIComponent(sessionId)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as CheckoutStatus;

        if (cancelled) {
          return;
        }

        setCheckoutStatus(data);

        if (data.status === "completed") {
          return;
        }
      } finally {
        attempts += 1;

        if (!cancelled && attempts < 15) {
          timeoutId = setTimeout(loadStatus, 1_000);
        }
      }
    }

    void loadStatus();

    return () => {
      cancelled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [sessionId]);

  useEffect(() => {
    if (checkoutStatus.status !== "completed") {
      return;
    }

    router.refresh();

    const timeoutId = window.setTimeout(() => {
      router.replace("/credits");
    }, 4_000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [checkoutStatus.status, router]);

  if (checkoutStatus.status === "pending") {
    return (
      <Alert className="border-amber-500/20 bg-amber-500/10">
        <Loader2 className="size-4 animate-spin text-amber-400" />

        <AlertTitle className="text-amber-200">Zahlung wird verarbeitet</AlertTitle>

        <AlertDescription className="text-amber-200/80">Dein Guthaben wird gerade aktualisiert.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-emerald-500/20 bg-emerald-500/10">
      <CheckCircle2 className="size-4 text-emerald-400" />

      <AlertTitle className="text-emerald-200">Guthaben wurde gutgeschrieben</AlertTitle>

      <AlertDescription className="text-emerald-200/80">
        <strong>{checkoutStatus.totalCredits.toLocaleString("de-CH")} Credits</strong> wurden deinem Guthaben hinzugefügt.
        {checkoutStatus.paidCredits !== null && checkoutStatus.bonusCredits !== null && checkoutStatus.bonusCredits > 0 ? (
          <span className="mt-1 block">
            {checkoutStatus.paidCredits.toLocaleString("de-CH")} gekauft
            {" · "}
            {checkoutStatus.bonusCredits.toLocaleString("de-CH")} Bonus
          </span>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
