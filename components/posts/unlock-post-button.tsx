"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Coins, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { unlockPostAction } from "@/actions/unlock-post";

type UnlockPostButtonProps = {
  postId: string;
  priceCredits: number;
  disabled?: boolean;
};

export function UnlockPostButton({ postId, priceCredits, disabled = false }: UnlockPostButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUnlocked, setIsUnlocked] = useState(false);

  function handleUnlock(): void {
    startTransition(async () => {
      const result = await unlockPostAction(postId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setIsUnlocked(true);
      toast.success("Inhalt wurde freigeschaltet.");
      router.refresh();
    });
  }

  if (isUnlocked) {
    return (
      <Button disabled className="w-full">
        Freigeschaltet
      </Button>
    );
  }

  return (
    <Button type="button" className="w-full" disabled={disabled || isPending} onClick={handleUnlock}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}

      <span>Für {priceCredits} Credits freischalten</span>

      <Coins className="size-4" />
    </Button>
  );
}
