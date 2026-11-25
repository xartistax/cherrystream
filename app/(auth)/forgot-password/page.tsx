import { ForgotPasswordForm } from "@/components/auth/password-reset-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Passwort vergessen",
};

export default function ForgotPasswordPage() {
  return (
    <Card className="border-white/10 bg-zinc-900/80 text-white shadow-2xl backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Passwort vergessen</CardTitle>

        <CardDescription className="text-zinc-400">Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link, mit dem du ein neues Passwort festlegst.</CardDescription>
      </CardHeader>

      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
