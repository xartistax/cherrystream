import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <Card className="border-white/10 bg-zinc-900/80 text-white shadow-2xl backdrop-blur-xl">
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  );
}
