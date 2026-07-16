"use client";

import { LoaderCircle, UserCheck, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

import { toggleFollowAction } from "@/actions/toggle-follow";
import { Button } from "@/components/ui/button";

type FollowButtonProps = {
  username: string;
  authenticated: boolean;
  initialFollowing: boolean;
  initialFollowerCount: number;
};

type FollowState = {
  following: boolean;
  followerCount: number;
};

export function FollowButton({ username, authenticated, initialFollowing, initialFollowerCount }: FollowButtonProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [state, setOptimisticState] = useOptimistic<FollowState, Partial<FollowState>>(
    {
      following: initialFollowing,
      followerCount: initialFollowerCount,
    },
    (current, update) => ({
      ...current,
      ...update,
    }),
  );

  function handleFollow() {
    if (!authenticated) {
      router.push(`/login?callbackUrl=/profile/${username}`);
      return;
    }

    startTransition(async () => {
      const nextFollowing = !state.following;

      setOptimisticState({
        following: nextFollowing,
        followerCount: state.followerCount + (nextFollowing ? 1 : -1),
      });

      const result = await toggleFollowAction(username);

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
      disabled={isPending}
      onClick={handleFollow}
      variant={state.following ? "outline" : "default"}
      className={state.following ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "bg-rose-600 text-white hover:bg-rose-500"}
    >
      {isPending ? <LoaderCircle className="size-4 animate-spin" /> : state.following ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}

      {state.following ? "Gefolgt" : "Folgen"}
    </Button>
  );
}
