import type { Metadata } from "next";
import Link from "next/link";

import { confirmEmailAction } from "@/actions/verify-email";
import { SubmitButton } from "@/components/auth/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { peekEmailToken } from "@/lib/email/tokens";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "E-Mail bestätigen",
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

type VerifyEmailPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function VerifyEmailPage({ params }: VerifyEmailPageProps) {
  const { token } = await params;
  const valid = await peekEmailToken("verify-email", token);

  return (
    <Card className="border-white/10 bg-zinc-900/80 text-white shadow-2xl backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl">{valid ? "E-Mail-Adresse bestätigen" : "Link ungültig"}</CardTitle>

        <CardDescription className="text-zinc-400">
          {valid
            ? "Ein Klick genügt, dann ist deine Adresse bestätigt."
            : "Der Link ist abgelaufen oder wurde bereits verwendet. Nach dem Anmelden kannst du in den Einstellungen einen neuen anfordern."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {valid ? (
          <form action={confirmEmailAction}>
            <input type="hidden" name="token" value={token} />
            <SubmitButton pendingText="Wird bestätigt ...">E-Mail bestätigen</SubmitButton>
          </form>
        ) : (
          <Link href="/login" className={cn(buttonVariants(), "w-full bg-rose-600 text-white hover:bg-rose-500")}>
            Zur Anmeldung
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
