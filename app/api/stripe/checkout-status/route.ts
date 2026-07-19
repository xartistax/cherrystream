import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const checkoutSessionId = searchParams.get("session_id");

  if (!checkoutSessionId?.startsWith("cs_")) {
    return NextResponse.json({ error: "Ungültige Checkout-Session." }, { status: 400 });
  }

  const transaction = await prisma.walletTransaction.findFirst({
    where: {
      referenceId: checkoutSessionId,
      type: "CREDIT_PURCHASE",
      wallet: {
        userId: session.user.id,
      },
    },
    select: {
      amountCredits: true,
      metadata: true,
    },
  });

  if (!transaction) {
    return NextResponse.json({
      status: "pending",
    });
  }

  const metadata =
    typeof transaction.metadata === "object" && transaction.metadata !== null && !Array.isArray(transaction.metadata) ? transaction.metadata : null;

  const paidCredits = metadata && "paidCredits" in metadata && typeof metadata.paidCredits === "number" ? metadata.paidCredits : null;

  const bonusCredits = metadata && "bonusCredits" in metadata && typeof metadata.bonusCredits === "number" ? metadata.bonusCredits : null;

  return NextResponse.json({
    status: "completed",
    totalCredits: transaction.amountCredits ?? 0,
    paidCredits,
    bonusCredits,
  });
}
