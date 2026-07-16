import { Cherry } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-zinc-950 px-4 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(225,29,72,0.24),transparent_48%)]" />
      <div className="pointer-events-none absolute -left-32 top-1/3 size-96 rounded-full bg-fuchsia-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-96 rounded-full bg-rose-600/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3 font-sans text-3xl font-black tracking-tight">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-rose-600 shadow-lg shadow-rose-600/25">
            <Cherry className="size-5" />
          </span>

          <span>
            Cherry <span className="text-rose-500">Stream</span>
          </span>
        </Link>

        {children}
      </div>
    </main>
  );
}
