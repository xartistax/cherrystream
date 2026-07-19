import { ArrowDownLeft, ArrowUpRight, Coins, Gift, Sparkles, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletTransactionType, WalletBalanceType } from "@/generated/prisma/enums";

type WalletHistoryItem = {
  id: string;
  type: WalletTransactionType;
  balanceType: WalletBalanceType;
  amountCredits: number | null;
  amountRappen: number | null;
  description: string | null;
  createdAt: Date;
};

type WalletHistoryProps = {
  transactions: WalletHistoryItem[];
};

function getTransactionMeta(type: WalletTransactionType) {
  switch (type) {
    case "CREDIT_PURCHASE":
      return {
        icon: Coins,
        title: "Credits gekauft",
        positive: true,
      };

    case "PREMIUM_UNLOCK":
      return {
        icon: ArrowUpRight,
        title: "Premium freigeschaltet",
        positive: false,
      };

    case "TIP_SENT":
      return {
        icon: ArrowUpRight,
        title: "Trinkgeld gesendet",
        positive: false,
      };

    case "TIP_RECEIVED":
      return {
        icon: Gift,
        title: "Trinkgeld erhalten",
        positive: true,
      };

    case "BOOST_PURCHASE":
      return {
        icon: Sparkles,
        title: "Boost gekauft",
        positive: false,
      };

    case "EARNINGS_CONVERSION":
      return {
        icon: Wallet,
        title: "Einnahmen umgewandelt",
        positive: true,
      };

    case "PAYOUT":
      return {
        icon: ArrowDownLeft,
        title: "Auszahlung",
        positive: false,
      };

    case "ADJUSTMENT":
      return {
        icon: Wallet,
        title: "Anpassung",
        positive: true,
      };
    default:
      return {
        icon: Wallet,
        title: type,
        positive: true,
      };
  }
}

export function WalletHistory({ transactions }: WalletHistoryProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-white">Wallet-Verlauf</CardTitle>
      </CardHeader>

      <CardContent>
        {transactions.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-500">Noch keine Transaktionen vorhanden.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {transactions.map((transaction) => {
              const meta = getTransactionMeta(transaction.type);
              const Icon = meta.icon;

              return (
                <div key={transaction.id} className="flex items-center justify-between gap-6 py-5">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                      <Icon className="size-5 text-rose-400" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{meta.title}</p>

                      {transaction.description && <p className="mt-0.5 truncate text-sm text-zinc-400">{transaction.description}</p>}

                      <p className="mt-1 text-xs text-zinc-600">{transaction.createdAt.toLocaleString("de-CH")}</p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {transaction.amountCredits !== null && (
                      <p className={meta.positive ? "text-lg font-semibold text-emerald-400" : "text-lg font-semibold text-red-400"}>
                        {meta.positive ? "+" : "-"}
                        {transaction.amountCredits.toLocaleString("de-CH")} Credits
                      </p>
                    )}

                    {transaction.amountRappen !== null && (
                      <p className={meta.positive ? "text-lg font-semibold text-emerald-400" : "text-lg font-semibold text-red-400"}>
                        {meta.positive ? "+" : "-"}CHF{" "}
                        {(transaction.amountRappen / 100).toLocaleString("de-CH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
