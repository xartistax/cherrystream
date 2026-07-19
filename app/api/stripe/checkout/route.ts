import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { calculateCreditPackageTotal, getCreditPackage } from "@/lib/economy";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const packageId = typeof body === "object" && body !== null && "packageId" in body && typeof body.packageId === "string" ? body.packageId : null;

  if (!packageId) {
    return NextResponse.json({ error: "Credit-Paket fehlt." }, { status: 400 });
  }

  const creditPackage = getCreditPackage(packageId);

  if (!creditPackage) {
    return NextResponse.json({ error: "Ungültiges Credit-Paket." }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL fehlt." }, { status: 500 });
  }

  try {
    const totalCredits = calculateCreditPackageTotal(creditPackage.paidCredits, creditPackage.bonusCredits);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: session.user.id,
      success_url: `${appUrl}/credits?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/credits?checkout=cancelled`,
      metadata: {
        userId: session.user.id,
        packageId: creditPackage.id,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "chf",
            unit_amount: creditPackage.priceRappen,
            product_data: {
              name: `${totalCredits.toLocaleString("de-CH")} Credits`,
              description:
                creditPackage.bonusCredits > 0
                  ? `${creditPackage.paidCredits.toLocaleString("de-CH")} Credits + ${creditPackage.bonusCredits.toLocaleString("de-CH")} Bonus`
                  : undefined,
            },
          },
        },
      ],
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Stripe Checkout konnte nicht gestartet werden." }, { status: 500 });
    }

    return NextResponse.json({
      url: checkoutSession.url,
    });
  } catch {
    return NextResponse.json({ error: "Stripe Checkout konnte nicht gestartet werden." }, { status: 500 });
  }
}
