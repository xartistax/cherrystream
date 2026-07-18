import Image from "next/image";

import { PremiumPostOverlay } from "@/components/posts/premium-post-overlay";

type PostMediaItem = {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
};

type PostMediaProps = {
  postId: string;
  media: PostMediaItem[];
  visibility: "PUBLIC" | "FOLLOWERS" | "PREMIUM";
  unlockPrice: number | null;
  canView: boolean;
  isAuthenticated: boolean;
};

export function PostMedia({ postId, media, visibility, unlockPrice, canView, isAuthenticated }: PostMediaProps) {
  const isLocked = visibility === "PREMIUM" && !canView && unlockPrice !== null && unlockPrice > 0;

  return (
    <div className="relative overflow-hidden rounded-xl bg-muted">
      <div className={isLocked ? "pointer-events-none select-none blur-2xl" : undefined}>
        {media.map((item) =>
          item.type === "IMAGE" ? (
            <div key={item.id} className="relative aspect-4/5 w-full">
              <Image src={item.url} alt="" fill sizes="(max-width: 768px) 100vw, 640px" className="object-cover" />
            </div>
          ) : (
            <video key={item.id} src={item.url} controls={!isLocked} preload="metadata" className="aspect-4/5 w-full object-cover" />
          ),
        )}
      </div>

      {isLocked ? <PremiumPostOverlay postId={postId} priceCredits={unlockPrice} isAuthenticated={isAuthenticated} /> : null}
    </div>
  );
}
