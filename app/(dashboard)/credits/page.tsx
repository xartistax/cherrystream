import { Coins, CreditCard } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { paymentsEnabled } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { WalletHistory } from "@/components/credits/wallet-history";

export default async function CreditsPage() {
  if (!paymentsEnabled) {
    notFound();
  }

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const wallet = await prisma.wallet.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      userCredits: true,
      earningsRappen: true,
    },
  });

  const transactions = await prisma.walletTransaction.findMany({
    where: {
      wallet: {
        userId: session.user.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    select: {
      id: true,
      type: true,
      balanceType: true,
      amountCredits: true,
      amountRappen: true,
      description: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Credits</h1>
        <p className="mt-2 text-zinc-400">Verwalte dein Guthaben und kaufe neue Credits.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Coins className="size-5 text-rose-400" />
              Guthaben
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-4xl font-bold text-white">{wallet?.userCredits ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="size-5 text-rose-400" />
              Guthaben
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-4xl font-bold text-white">CHF {((wallet?.earningsRappen ?? 0) / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">Credits kannst du bald direkt hier kaufen.</p>

      <WalletHistory transactions={transactions} />
    </div>
  );
}
