"use client";

import { Heart, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

import { togglePostLikeAction } from "@/actions/toggle-post-like";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfileLikeButtonProps = {
  postId: string;
  username: string;
  initialLiked: boolean;
  initialCount: number;
  authenticated: boolean;
};

type OptimisticLikeState = {
  liked: boolean;
  count: number;
};

export function ProfileLikeButton({ postId, username, initialLiked, initialCount, authenticated }: ProfileLikeButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [state, updateOptimisticState] = useOptimistic<OptimisticLikeState, boolean>(
    {
      liked: initialLiked,
      count: initialCount,
    },
    (currentState, liked) => ({
      liked,
      count: Math.max(0, currentState.count + (liked ? 1 : -1)),
    }),
  );

  function handleLike() {
    if (!authenticated) {
      router.push(`/login?callbackUrl=/profile/${username}`);
      return;
    }

    startTransition(async () => {
      updateOptimisticState(!state.liked);

      const result = await togglePostLikeAction(postId, username);

      if (!result.success) {
        router.refresh();
        return;
      }

      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={handleLike}
      className={cn("gap-1.5 bg-black/55 text-white backdrop-blur-md hover:bg-black/75", state.liked && "text-rose-400")}
    >
      {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Heart className={cn("size-4", state.liked && "fill-current")} />}

      {state.count}
    </Button>
  );
}
