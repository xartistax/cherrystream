import { Globe2, LockKeyhole, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PostVisibility } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

type VisibilityBadgeProps = {
  visibility: PostVisibility;
  className?: string;
};

const visibilityConfig = {
  PUBLIC: {
    label: "Öffentlich",
    icon: Globe2,
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
  FOLLOWERS: {
    label: "Follower",
    icon: UsersRound,
    className: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  },
  PREMIUM: {
    label: "Premium",
    icon: LockKeyhole,
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },
} satisfies Record<
  PostVisibility,
  {
    label: string;
    icon: typeof Globe2;
    className: string;
  }
>;

export function VisibilityBadge({ visibility, className }: VisibilityBadgeProps) {
  const config = visibilityConfig[visibility];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium", config.className, className)}>
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}
