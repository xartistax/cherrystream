import { Menu } from "lucide-react";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import { getDashboardButton } from "../layout/navigation";
import { UserMenu } from "../shared/user-menu";

const navigationItems = [
  {
    label: "Entdecken",
    href: "/explore",
  },
] as const;

export async function PublicNavbar() {
  const session = await auth();

  const dashboardButton = session?.user ? getDashboardButton(session.user.role) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {session?.user && dashboardButton ? (
            <>
              <Link
                href={dashboardButton.href}
                className={cn(
                  buttonVariants({
                    variant: "default",
                  }),
                  "hidden bg-rose-600 text-white hover:bg-rose-500 sm:inline-flex",
                )}
              >
                {dashboardButton.label}
              </Link>

              <UserMenu username={session.user.username} role={session.user.role} />
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({
                    variant: "ghost",
                  }),
                  "text-zinc-300 hover:bg-white/5 hover:text-white",
                )}
              >
                Anmelden
              </Link>

              <Link
                href="/register"
                className={cn(
                  buttonVariants({
                    variant: "default",
                  }),
                  "bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500",
                )}
              >
                Kostenlos registrieren
              </Link>
            </div>
          )}
        </div>

        {!session?.user && (
          <Link
            href="/explore"
            aria-label="Navigation öffnen"
            className={cn(
              buttonVariants({
                variant: "ghost",
                size: "icon",
              }),
              "text-zinc-300 hover:bg-white/5 hover:text-white sm:hidden",
            )}
          >
            <Menu className="size-5" />
          </Link>
        )}
      </div>
    </header>
  );
}
