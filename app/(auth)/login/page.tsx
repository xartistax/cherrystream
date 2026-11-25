import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getHomePath } from "@/lib/impersonation";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type LoginPageProps = {
  searchParams: Promise<{
    registered?: string;
    reset?: string;
    verified?: string;
    callbackUrl?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = getSafeRedirectPath(params.callbackUrl, "");

  if (session?.user) {
    redirect(callbackUrl || getHomePath(session.user.role));
  }

  const notice =
    params.reset === "1"
      ? "Dein Passwort wurde geändert. Melde dich mit dem neuen Passwort an."
      : params.registered === "1"
        ? "Dein Konto wurde erstellt. Wir haben dir eine E-Mail zur Bestätigung deiner Adresse geschickt. Du kannst dich schon jetzt anmelden."
        : params.verified === "1"
          ? "Deine E-Mail-Adresse ist bestätigt."
          : null;

  return (
    <Card className="border-white/10 bg-zinc-900/80 text-white shadow-2xl backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Willkommen zurück</CardTitle>

        <CardDescription className="text-zinc-400">Melde dich bei CherryStream an.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {notice ? <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-300">{notice}</div> : null}

        <LoginForm callbackUrl={callbackUrl || undefined} />
      </CardContent>
    </Card>
  );
}
