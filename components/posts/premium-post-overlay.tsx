import { Coins, LockKeyhole } from "lucide-react";

import { UnlockPostButton } from "@/components/posts/unlock-post-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PremiumPostOverlayProps = {
  postId: string;
  priceCredits: number;
  isAuthenticated: boolean;
};

export function PremiumPostOverlay({ postId, priceCredits, isAuthenticated }: PremiumPostOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/75 p-4 backdrop-blur-xl">
      <Card className="w-full max-w-sm border-primary/20 shadow-xl">
        <CardHeader className="items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LockKeyhole className="size-6" />
          </div>

          <CardTitle>Premium-Inhalt</CardTitle>

          <CardDescription>Schalte diesen Beitrag dauerhaft frei.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2 rounded-lg bg-muted px-4 py-3 font-semibold">
            <Coins className="size-5 text-primary" />
            {priceCredits} Credits
          </div>

          {isAuthenticated ? (
            <UnlockPostButton postId={postId} priceCredits={priceCredits} />
          ) : (
            <p className="text-center text-sm text-muted-foreground">Melde dich an, um diesen Beitrag freizuschalten.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
