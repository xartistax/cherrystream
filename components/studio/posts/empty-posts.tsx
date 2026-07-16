import { ImagePlus } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EmptyPosts() {
  return (
    <Card className="border-dashed border-white/10 bg-zinc-900/40">
      <CardContent className="flex flex-col items-center px-8 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
          <ImagePlus className="size-8" />
        </div>

        <h2 className="mt-6 text-2xl font-bold text-white">Deine Galerie ist noch leer</h2>

        <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">
          Veröffentliche dein erstes Bild oder Video. Neue Inhalte erscheinen automatisch auf deinem öffentlichen Profil und können später als Premium-Inhalte
          angeboten werden.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="#publish" className={cn(buttonVariants(), "bg-rose-600 text-white hover:bg-rose-500")}>
            Erste Veröffentlichung
          </Link>

          <Link
            href="/profile/edit"
            className={cn(
              buttonVariants({
                variant: "outline",
              }),
              "border-white/10 bg-white/5 text-white hover:bg-white/10",
            )}
          >
            Profil bearbeiten
          </Link>
        </div>

        <div className="mt-10 grid w-full max-w-xl gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/3 p-4">
            <p className="text-lg font-bold text-white">📷</p>

            <p className="mt-2 text-sm font-medium text-white">Fotos</p>

            <p className="mt-1 text-xs text-zinc-500">Einzelbilder oder Galerien veröffentlichen.</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/3 p-4">
            <p className="text-lg font-bold text-white">🎥</p>

            <p className="mt-2 text-sm font-medium text-white">Videos</p>

            <p className="mt-1 text-xs text-zinc-500">Automatisch optimiert inklusive Posterbild.</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/3 p-4">
            <p className="text-lg font-bold text-white">🔒</p>

            <p className="mt-2 text-sm font-medium text-white">Premium</p>

            <p className="mt-1 text-xs text-zinc-500">Inhalte später mit Credits freischalten.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
