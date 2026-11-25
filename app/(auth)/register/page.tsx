import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getHomePath } from "@/lib/impersonation";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent } from "@/components/ui/card";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

type RegisterPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const session = await auth();
  const callbackUrl = getSafeRedirectPath((await searchParams).callbackUrl, "");

  if (session?.user) {
    redirect(callbackUrl || getHomePath(session.user.role));
  }

  return (
    <Card className="border-white/10 bg-zinc-900/80 text-white shadow-2xl backdrop-blur-xl">
      <CardContent>
        <RegisterForm callbackUrl={callbackUrl || undefined} />
      </CardContent>
    </Card>
  );
}
