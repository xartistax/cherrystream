import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/password-reset-forms";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { peekEmailToken } from "@/lib/email/tokens";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// The token is part of the URL: keep it out of search engines and Referer headers.
export const metadata: Metadata = {
  title: "Neues Passwort",
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

type ResetPasswordPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = await params;
  const valid = await peekEmailToken("password-reset", token);

  return (
    <Card className="border-white/10 bg-zinc-900/80 text-white shadow-2xl backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl">{valid ? "Neues Passwort festlegen" : "Link ungültig"}</CardTitle>

        <CardDescription className="text-zinc-400">
          {valid ? "Danach wirst du auf allen Geräten abgemeldet und meldest dich mit dem neuen Passwort an." : "Der Link ist abgelaufen oder wurde bereits verwendet."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {valid ? (
          <ResetPasswordForm token={token} />
        ) : (
          <Link href="/forgot-password" className={cn(buttonVariants(), "w-full bg-rose-600 text-white hover:bg-rose-500")}>
            Neuen Link anfordern
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
