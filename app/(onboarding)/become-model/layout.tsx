import { ArrowLeft, Cherry } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type BecomeModelLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function BecomeModelLayout({ children }: BecomeModelLayoutProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role === "MODEL" || session.user.role === "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-white/10 bg-zinc-950/95">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/explore"
            className={cn(
              buttonVariants({
                variant: "ghost",
                size: "sm",
              }),
              "-ml-3 text-zinc-400 hover:bg-white/5 hover:text-white",
            )}
          >
            <ArrowLeft className="size-4" />
            Zurück
          </Link>

          <Link href="/explore" aria-label="CherryStream" className="flex items-center gap-2 font-bold tracking-tight text-white">
            <span className="flex size-8 items-center justify-center rounded-xl bg-rose-500 text-white">
              <Cherry className="size-4" />
            </span>

            <span className="hidden sm:inline">CherryStream</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
    </div>
  );
}
