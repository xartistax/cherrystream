import { Coins } from "lucide-react";

import { LogoutButton } from "@/components/shared/logout-button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserRole } from "@/generated/prisma/enums";
import { paymentsEnabled } from "@/lib/features";

type SidebarProps = {
  user: {
    username: string;
    displayName: string;
    image: string | null;
    credits: number;
    role: UserRole;
  };
};

function getInitials(value: string): string {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Sidebar({ user }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-zinc-950/85 p-5 backdrop-blur-xl lg:flex lg:flex-col">
      <Logo className="px-2" />

      <div className="mt-8">
        <SidebarNav role={user.role} />
      </div>

      <div className="mt-auto space-y-4">
        {paymentsEnabled ? (
          <div className="rounded-2xl border border-rose-500/15 bg-linear-to-br from-rose-500/10 to-transparent p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-zinc-400">Guthaben</span>

              <Coins className="size-4 text-amber-400" />
            </div>

            <div className="flex items-end justify-between">
              <strong className="text-2xl text-white">{user.credits}</strong>

              <Badge className="bg-rose-500/15 text-rose-300 hover:bg-rose-500/15">Credits</Badge>
            </div>
          </div>
        ) : null}

        <Separator className="bg-white/10" />

        <div className="flex items-center gap-3">
          <Avatar className="size-10 border border-white/10">
            <AvatarImage src={user.image ?? undefined} alt={user.displayName} />
            <AvatarFallback className="bg-rose-500/15 text-rose-300">{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.displayName}</p>
            <p className="truncate text-xs text-zinc-500">@{user.username}</p>
          </div>

          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
