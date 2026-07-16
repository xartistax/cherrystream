import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from "lucide-react";
import Link from "next/link";

import { PostMedia } from "@/components/studio/post-media";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type PostCardProps = {
  post: {
    id: string;
    content: string | null;
    createdAt: Date;
    author: {
      username: string;
      name: string | null;
      image: string | null;
      profile: {
        displayName: string;
        city: {
          name: string;
        } | null;
        canton: {
          name: string;
        } | null;
      } | null;
    };
    media: Array<{
      id: string;
      type: "IMAGE" | "VIDEO";
      url: string;
      feedUrl: string | null;
      fullUrl: string | null;
      posterUrl: string | null;
      duration: number | null;
      blurHash: string | null;
      width: number | null;
      height: number | null;
    }>;
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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("de-CH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function PostCard({ post }: PostCardProps) {
  const displayName = post.author.profile?.displayName ?? post.author.name ?? post.author.username;

  return (
    <Card className="overflow-hidden border-white/10 bg-zinc-900/70 text-white shadow-xl shadow-black/10">
      <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
        <Link href={`/profile/${post.author.username}`}>
          <Avatar className="size-11 border border-white/10">
            <AvatarImage src={post.author.image ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-rose-500/15 text-rose-300">{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <Link href={`/profile/${post.author.username}`} className="block truncate text-sm font-semibold hover:text-rose-300">
            {displayName}
          </Link>

          <p className="truncate text-xs text-zinc-500">
            @{post.author.username}
            {[post.author.profile?.city?.name, post.author.profile?.canton?.name]

              .filter(Boolean)

              .join(", ") && (
              <>
                {" · "}

                {[post.author.profile?.city?.name, post.author.profile?.canton?.name]

                  .filter(Boolean)

                  .join(", ")}
              </>
            )}
            {" · "}
            {formatDate(post.createdAt)}
          </p>
        </div>

        <Button type="button" variant="ghost" size="icon" className="text-zinc-500" aria-label="Mehr Optionen">
          <MoreHorizontal className="size-5" />
        </Button>
      </CardHeader>

      {post.content ? (
        <CardContent className="px-4 pb-4 pt-0">
          <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-200">{post.content}</p>
        </CardContent>
      ) : null}

      <PostMedia media={post.media} />

      <CardContent className="flex items-center justify-between p-3">
        <div className="flex items-center">
          <Button type="button" variant="ghost" size="sm" className="text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400">
            <Heart className="size-5" />0
          </Button>

          <Button type="button" variant="ghost" size="sm" className="text-zinc-400">
            <MessageCircle className="size-5" />0
          </Button>

          <Button type="button" variant="ghost" size="icon" className="text-zinc-400">
            <Send className="size-5" />
          </Button>
        </div>

        <Button type="button" variant="ghost" size="icon" className="text-zinc-400">
          <Bookmark className="size-5" />
        </Button>
      </CardContent>
    </Card>
  );
}
