import { Cherry } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  compact?: boolean;
  className?: string;
};

export function Logo({ compact = false, className }: LogoProps) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-3 font-black tracking-tight text-white", className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-600/25">
        <Cherry className="size-5" />
      </span>

      {!compact ? (
        <span className="text-xl">
          Cherry<span className="text-rose-500">Stream</span>
        </span>
      ) : null}
    </Link>
  );
}
