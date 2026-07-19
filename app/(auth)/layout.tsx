import { Cherry } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="relative min-h-svh overflow-hidden bg-zinc-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(225,29,72,0.24),transparent_48%)]" />
      <div className="pointer-events-none absolute -left-32 top-1/3 size-96 rounded-full bg-fuchsia-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-96 rounded-full bg-rose-600/10 blur-3xl" />

      <header className="relative z-10 border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 font-sans text-xl font-black tracking-tight">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-rose-600 shadow-lg shadow-rose-600/25">
              <Cherry className="size-5" />
            </span>

            <span>
              Cherry <span className="text-rose-500">Stream</span>
            </span>
          </Link>

          <Link href="/explore" className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
            Entdecken
          </Link>
        </div>
      </header>

      <div className="relative flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  );
}
