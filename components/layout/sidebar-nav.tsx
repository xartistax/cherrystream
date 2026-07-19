"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getNavigationItems } from "@/components/layout/navigation";
import { cn } from "@/lib/utils";
import { UserRole } from "@/generated/prisma/enums";

type SidebarNavProps = {
  role: UserRole;
};

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();
  const isBecomeModelFlow = pathname.startsWith("/become-model");
  const navigationItems = getNavigationItems(role, isBecomeModelFlow);

  return (
    <nav className="space-y-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;

        const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "bg-rose-500/15 text-rose-300" : "text-zinc-400 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className={cn("size-5 transition-colors", isActive ? "text-rose-400" : "text-zinc-500 group-hover:text-white")} />

            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
