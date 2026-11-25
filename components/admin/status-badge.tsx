import { CircleAlert, CircleCheck, CircleMinus, CircleX } from "lucide-react";

import type { CheckStatus } from "@/lib/admin/system-status";
import { cn } from "@/lib/utils";

const statusStyles: Record<CheckStatus, { label: string; className: string; icon: typeof CircleCheck }> = {
  ok: {
    label: "OK",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    icon: CircleCheck,
  },
  warn: {
    label: "Warnung",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    icon: CircleAlert,
  },
  error: {
    label: "Fehler",
    className: "border-rose-500/20 bg-rose-500/10 text-rose-300",
    icon: CircleX,
  },
  disabled: {
    label: "Deaktiviert",
    className: "border-white/10 bg-white/5 text-zinc-400",
    icon: CircleMinus,
  },
};

export function StatusBadge({ status }: { status: CheckStatus }) {
  const style = statusStyles[status];
  const Icon = style.icon;

  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", style.className)}>
      <Icon className="size-3.5" />
      {style.label}
    </span>
  );
}
