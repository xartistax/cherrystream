import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";

import { setPostHiddenAction } from "@/actions/admin/moderation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AdminPostsPageProps = {
  searchParams: Promise<{
    filter?: string;
  }>;
};

export default async function AdminPostsPage({ searchParams }: AdminPostsPageProps) {
  const showHidden = (await searchParams).filter === "hidden";

  const posts = await prisma.post.findMany({
    where: {
      status: showHidden ? "HIDDEN" : "PUBLISHED",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 48,
    select: {
      id: true,
      content: true,
      status: true,
      visibility: true,
      createdAt: true,
      author: {
        select: {
          username: true,
        },
      },
      media: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,
        select: {
          type: true,
          feedUrl: true,
          posterUrl: true,
          url: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[
          { label: "Veröffentlicht", href: "/admin/posts", active: !showHidden },
          { label: "Ausgeblendet", href: "/admin/posts?filter=hidden", active: showHidden },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn("rounded-xl px-3 py-2 text-sm", tab.active ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white")}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-zinc-500">Keine Uploads.</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {posts.map((post) => {
          const media = post.media[0];
          const thumbnail = media ? (media.type === "VIDEO" ? media.posterUrl : (media.feedUrl ?? media.url)) : null;

          return (
            <Card key={post.id} className="overflow-hidden border-white/10 bg-zinc-900/70 text-white">
              <div className="relative aspect-square bg-black">
                {thumbnail ? <Image src={thumbnail} alt="" fill sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" /> : null}

                {media?.type === "VIDEO" ? (
                  <span className="absolute top-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white">Video</span>
                ) : null}
              </div>

              <CardContent className="space-y-3 p-4">
                <div className="text-sm">
                  <Link href={`/profile/${post.author.username}`} className="font-medium hover:underline">
                    @{post.author.username}
                  </Link>

                  <p className="text-xs text-zinc-500">
                    {formatDistanceToNow(post.createdAt, { addSuffix: true, locale: de })} · {post.visibility}
                  </p>
                </div>

                {post.content ? <p className="line-clamp-2 text-sm text-zinc-400">{post.content}</p> : null}

                <form action={setPostHiddenAction}>
                  <input type="hidden" name="postId" value={post.id} />
                  <input type="hidden" name="hide" value={post.status === "HIDDEN" ? "false" : "true"} />

                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full border-white/10 bg-white/5",
                      post.status === "HIDDEN" ? "text-emerald-300 hover:text-emerald-200" : "text-rose-300 hover:text-rose-200",
                    )}
                  >
                    {post.status === "HIDDEN" ? "Wieder einblenden" : "Ausblenden"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
