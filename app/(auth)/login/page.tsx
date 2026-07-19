import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type LoginPageProps = {
  searchParams: Promise<{
    registered?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const registrationSuccessful = params.registered === "1";

  return (
    <Card className="border-white/10 bg-zinc-900/80 text-white shadow-2xl backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Willkommen zurück</CardTitle>

        <CardDescription className="text-zinc-400">Melde dich bei CherryStream an.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {registrationSuccessful ? (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            Dein Konto wurde erstellt. Du kannst dich jetzt anmelden.
          </div>
        ) : null}

        <LoginForm />
      </CardContent>
    </Card>
  );
}
