import Link from "next/link";
import { ArrowRight, BarChart3, MessageCircle, Search, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Model werden",
};

export default async function BecomeModelPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role === "MODEL" || session.user.role === "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl py-8 sm:py-12">
      <Card className="overflow-hidden border-white/10 bg-zinc-900/70 text-white shadow-2xl shadow-black/20">
        <CardHeader className="items-center border-b border-white/10 bg-white/[0.02] px-6 py-10 text-center sm:px-10">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
            <Sparkles className="size-7" />
          </div>

          <CardTitle className="mt-4 text-3xl font-black tracking-tight">Werde Model auf CherryStream</CardTitle>

          <CardDescription className="max-w-lg text-base leading-7 text-zinc-400">
            Werde von neuen Kunden in deiner Region gefunden und erhalte Anfragen direkt über deine bevorzugten Kontaktkanäle.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 p-6 sm:p-10">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Search className="size-5 text-rose-400" />
              <p className="mt-3 font-semibold">Gefunden werden</p>
              <p className="mt-1 text-sm leading-6 text-zinc-500">Sichtbar nach Kanton, Stadt und Kategorie.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <MessageCircle className="size-5 text-emerald-400" />
              <p className="mt-3 font-semibold">Direkte Anfragen</p>
              <p className="mt-1 text-sm leading-6 text-zinc-500">Kontakt per WhatsApp, Telefon oder Telegram.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <BarChart3 className="size-5 text-sky-400" />
              <p className="mt-3 font-semibold">Dashboard</p>
              <p className="mt-1 text-sm leading-6 text-zinc-500">Behalte Inhalte und Statistiken im Blick.</p>
            </div>
          </div>

          <Button render={<Link href="/become-model/profile" />} className="w-full bg-rose-600 text-white hover:bg-rose-500">
            Jetzt starten
            <ArrowRight className="size-4" />
          </Button>

          <p className="text-center text-xs leading-5 text-zinc-600">Dein Konto wird erst nach Abschluss des Onboardings in ein Model-Konto umgewandelt.</p>
        </CardContent>
      </Card>
    </div>
  );
}
