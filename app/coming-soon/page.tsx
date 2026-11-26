import { Cherry } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Bald verfügbar",
  robots: {
    index: false,
    follow: false,
  },
};

/** Shown to visitors without account or preview link while the coming-soon mode is on (proxy.ts). */
export default function ComingSoonPage() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-zinc-950 px-6 text-center text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.22),transparent_60%)]" />

      <div className="relative flex flex-col items-center">
        <span className="flex size-16 items-center justify-center rounded-3xl bg-linear-to-br from-rose-500 to-pink-600 shadow-2xl shadow-rose-600/30">
          <Cherry className="size-8" />
        </span>

        <p className="mt-6 text-2xl font-black tracking-tight">
          Cherry<span className="text-rose-500">Stream</span>
        </p>

        <h1 className="mt-10 text-4xl font-black tracking-tight sm:text-5xl">Bald verfügbar</h1>

        <p className="mt-4 max-w-md leading-7 text-zinc-400">
          Verifizierte Escort- und Erotik-Inserate aus der ganzen Schweiz. Wir bereiten den Start vor, schau bald wieder vorbei.
        </p>

        <Link href="/login" className="mt-10 text-sm font-medium text-rose-400 transition hover:text-rose-300">
          Anmelden
        </Link>
      </div>

      <footer className="absolute inset-x-0 bottom-6 flex justify-center gap-6 text-xs text-zinc-600">
        <Link href="/imprint" className="hover:text-zinc-400">
          Impressum
        </Link>
        <Link href="/privacy" className="hover:text-zinc-400">
          Datenschutz
        </Link>
      </footer>
    </main>
  );
}
