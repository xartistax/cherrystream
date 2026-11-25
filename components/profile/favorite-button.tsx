"use client";

import { Heart, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

import { toggleFollowAction } from "@/actions/toggle-follow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  username: string;
  authenticated: boolean;
  initialFavorite: boolean;
  compact?: boolean;
};

/** Private bookmark: only the visitor sees their favorites, there are no public counts. Stored in the Follow table. */
export function FavoriteButton({ username, authenticated, initialFavorite, compact = false }: FavoriteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [favorite, setOptimisticFavorite] = useOptimistic(initialFavorite);

  function handleClick() {
    if (!authenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/profile/${username}`)}`);
      return;
    }

    startTransition(async () => {
      setOptimisticFavorite(!favorite);
      await toggleFollowAction(username);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={handleClick}
      aria-pressed={favorite}
      aria-label={favorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      className={cn(
        "border-white/10 bg-white/5 text-white hover:bg-white/10",
        favorite && "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15",
        compact && "size-9 px-0",
      )}
    >
      {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Heart className={cn("size-4", favorite && "fill-current")} />}
      {compact ? null : favorite ? "In Favoriten" : "Merken"}
    </Button>
  );
}
