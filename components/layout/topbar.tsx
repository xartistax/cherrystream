import { Coins, Search } from "lucide-react";
import Link from "next/link";

import { isCreatorRole } from "@/components/layout/navigation";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { UserRole } from "@/generated/prisma/enums";
import { paymentsEnabled } from "@/lib/features";
import { cn } from "@/lib/utils";

type TopbarProps = {
  user: {
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

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo compact className="lg:hidden" />

        <div className="hidden flex-1 lg:block">
          <h1 className="text-sm font-semibold text-white">CherryStream</h1>

          <p className="text-xs text-zinc-500">Connect. Share. Meet.</p>
        </div>

        <Link
          href="/explore"
          className={cn(
            buttonVariants({
              variant: "outline",
            }),
            "ml-auto hidden w-full max-w-sm justify-start border-white/10 bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white sm:flex",
          )}
        >
          <Search className="size-4" />
          Profile und Beiträge suchen
        </Link>

        {paymentsEnabled ? (
          <Link href="/credits">
            <Badge variant="outline" className="gap-1.5 border-amber-500/20 bg-amber-500/10 text-amber-300">
              <Coins className="size-3.5" />
              {user.credits}
            </Badge>
          </Link>
        ) : null}

        <Link href={isCreatorRole(user.role) ? "/profile/edit" : "/settings"}>
          <Avatar className="size-9 border border-white/10">
            <AvatarImage src={user.image ?? undefined} alt={user.displayName} />

            <AvatarFallback className="bg-rose-500/15 text-xs text-rose-300">{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
