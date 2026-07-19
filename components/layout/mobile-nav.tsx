"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { UserRole } from "@/generated/prisma/enums";
import { getNavigationItems } from "./navigation";

type MobileNavProps = {
  role: UserRole;
};

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const mobileItems = getNavigationItems(role).slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-zinc-950/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium", isActive ? "text-rose-400" : "text-zinc-500")}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
