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
    case "PREMIUM_SALE":
      return {
        icon: Wallet,
        title: "Premium verkauft",
      };

    case "CREDIT_PURCHASE":
      return {
        icon: Coins,
        title: "Credits gekauft",
      };

    case "PREMIUM_UNLOCK":
      return {
        icon: ArrowUpRight,
        title: "Premium freigeschaltet",
      };

    case "TIP_SENT":
      return {
        icon: ArrowUpRight,
        title: "Trinkgeld gesendet",
      };

    case "TIP_RECEIVED":
      return {
        icon: Gift,
        title: "Trinkgeld erhalten",
      };

    case "BOOST_PURCHASE":
      return {
        icon: Sparkles,
        title: "Boost gekauft",
      };

    case "STARTER_CREDIT":
      return {
        icon: Gift,
        title: "Startguthaben",
      };

    case "EARNINGS_CONVERSION":
      return {
        icon: Wallet,
        title: "Einnahmen umgewandelt",
      };

    case "PAYOUT":
      return {
        icon: ArrowDownLeft,
        title: "Auszahlung",
      };

    case "ADJUSTMENT":
      return {
        icon: Wallet,
        title: "Anpassung",
      };
    default:
      return {
        icon: Wallet,
        title: type,
      };
  }
}

export function WalletHistory({ transactions }: WalletHistoryProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-white">Credit-Verlauf</CardTitle>
      </CardHeader>

      <CardContent>
        {transactions.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-500">Noch keine Transaktionen vorhanden.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {transactions.map((transaction) => {
              const meta = getTransactionMeta(transaction.type);
              const Icon = meta.icon;

              const amount = transaction.amountCredits ?? transaction.amountRappen ?? 0;

              const isPositive = amount > 0;

              return (
                <div key={transaction.id} className="flex items-center justify-between gap-6 py-5">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                      <Icon className="size-5 text-rose-400" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{meta.title}</p>

                      {transaction.description && <p className="mt-0.5 truncate text-sm text-zinc-400">{transaction.description}</p>}

                      <p className="mt-1 text-xs text-zinc-600">{transaction.createdAt.toLocaleString("de-CH", { timeZone: "Europe/Zurich" })}</p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {transaction.amountCredits !== null && (
                      <p className={isPositive ? "text-lg font-semibold text-emerald-400" : "text-lg font-semibold text-red-400"}>
                        {isPositive ? "+" : "-"}
                        {Math.abs(transaction.amountCredits).toLocaleString("de-CH")} Credits
                      </p>
                    )}

                    {transaction.amountRappen !== null && (
                      <p className={isPositive ? "text-lg font-semibold text-emerald-400" : "text-lg font-semibold text-red-400"}>
                        {isPositive ? "+" : "-"}CHF{" "}
                        {(Math.abs(transaction.amountRappen) / 100).toLocaleString("de-CH", {
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
