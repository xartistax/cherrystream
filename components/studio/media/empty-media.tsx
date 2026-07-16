import { ImagePlus, Images, Video } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EmptyMedia() {
  return (
    <Card className="border-dashed border-white/10 bg-zinc-900/40 text-white">
      <CardContent className="flex flex-col items-center px-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
          <Images className="size-8" />
        </div>

        <h2 className="mt-6 text-2xl font-bold">Deine Medienbibliothek ist leer</h2>

        <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-500">
          Sobald du Bilder oder Videos veröffentlichst, erscheinen sie automatisch hier und können zentral verwaltet werden.
        </p>

        <Link href="/studio#publish" className={cn(buttonVariants(), "mt-8 bg-rose-600 text-white hover:bg-rose-500")}>
          <ImagePlus className="size-4" />
          Inhalt veröffentlichen
        </Link>

        <div className="mt-10 grid w-full max-w-xl gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/3 p-5 text-left">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <Images className="size-5" />
            </div>

            <h3 className="mt-4 font-semibold text-white">Bilder</h3>

            <p className="mt-2 text-sm leading-6 text-zinc-500">Optimierte WebP-Versionen, BlurHash, Auflösung und Dateigröße verwalten.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/3 p-5 text-left">
            <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
              <Video className="size-5" />
            </div>

            <h3 className="mt-4 font-semibold text-white">Videos</h3>

            <p className="mt-2 text-sm leading-6 text-zinc-500">Videos mit Posterbild, Laufzeit, Format und Auflösung zentral anzeigen.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
