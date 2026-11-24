"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  {
    label: "Status",
    href: "/admin",
  },
  {
    label: "Verifizierungen",
    href: "/admin/verifications",
  },
  {
    label: "Benutzer",
    href: "/admin/users",
  },
  {
    label: "Inhalte",
    href: "/admin/posts",
  },
  {
    label: "Protokoll",
    href: "/admin/audit",
  },
] as const;

export function AdminNav({ pendingVerifications }: { pendingVerifications: number }) {
  const pathname = usePathname();

  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {items.map((item) => {
        const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

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
          </Link>
        );
      })}
    </nav>
  );
}
