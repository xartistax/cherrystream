"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNavigationItems, isNavigationItemActive } from "@/components/layout/navigation";
import { cn } from "@/lib/utils";

type AdminNavProps = {
  pendingVerifications: number;
  openReports: number;
};

export function AdminNav({ pendingVerifications, openReports }: AdminNavProps) {
  const pathname = usePathname();

  return (
    // Mobile only: on desktop the sidebar lists the same sections.
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:hidden">
      {adminNavigationItems.map((item) => {
        const isActive = isNavigationItemActive(item.href, pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
              isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white",
            )}
          >
            {item.label}

            {item.href === "/admin/verifications" && pendingVerifications > 0 ? (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">{pendingVerifications}</span>
            ) : null}

            {item.href === "/admin/reports" && openReports > 0 ? (
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-300">{openReports}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
