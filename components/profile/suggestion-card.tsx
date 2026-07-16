import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type SuggestionCardProps = {
  user: {
    username: string;
    displayName: string;
    image: string | null;
    city: string | null;
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

export function SuggestionCard({ user }: SuggestionCardProps) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-10 border border-white/10">
        <AvatarImage src={user.image ?? undefined} alt={user.displayName} />
        <AvatarFallback className="bg-rose-500/15 text-xs text-rose-300">{getInitials(user.displayName)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <Link href={`/profile/${user.username}`} className="block truncate text-sm font-semibold text-white hover:text-rose-300">
          {user.displayName}
        </Link>

        <p className="truncate text-xs text-zinc-500">{user.city ?? `@${user.username}`}</p>
      </div>

      <Button size="sm" variant="outline" disabled className="border-white/10 bg-white/5 text-xs">
        Folgen
      </Button>
    </div>
  );
}
