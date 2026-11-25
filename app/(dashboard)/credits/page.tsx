import { Coins, CreditCard } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { CreditPackages } from "@/components/credits/credit-packages";
import { CheckoutSuccess } from "@/components/credits/checkout-success";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { ECONOMY } from "@/lib/economy";
import { paymentsEnabled } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { WalletHistory } from "@/components/credits/wallet-history";

type CreditsPageProps = {
  searchParams: Promise<{
    checkout?: string;
    session_id?: string;
  }>;
};

export default async function CreditsPage({ searchParams }: CreditsPageProps) {
  if (!paymentsEnabled) {
    notFound();
  }

  const { checkout, session_id: sessionId } = await searchParams;

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

      {checkout === "success" && sessionId ? <CheckoutSuccess sessionId={sessionId} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Coins className="size-5 text-rose-400" />
              User Credits
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

      <CreditPackages packages={ECONOMY.creditPackages} />

      <WalletHistory transactions={transactions} />
    </div>
  );
}
