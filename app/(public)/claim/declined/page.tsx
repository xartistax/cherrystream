import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Daten gelöscht",
  robots: {
    index: false,
    follow: false,
  },
};

export default function InviteDeclinedPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <CircleCheck className="mx-auto size-10 text-emerald-400" />

      <h1 className="mt-6 text-2xl font-bold">Deine Daten wurden gelöscht</h1>

      <p className="mt-3 leading-7 text-zinc-400">Das vorbereitete Profil existiert nicht mehr, und wir werden dich nicht erneut einladen.</p>

      <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-8 border-white/10 bg-white/5")}>
        Zur Startseite
      </Link>
    </div>
  );
}
