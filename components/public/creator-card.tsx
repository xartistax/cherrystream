import { BadgeCheck, Camera, MapPin, UsersRound, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";


export type CreatorCardData = {
  username: string;
  name: string | null;
  image: string | null;

  profile: {
    displayName: string;
    city: string | null;
    canton: string | null;
    verified: boolean;

    categories: Array<{
      category: {
        name: string;
        slug: string;
      };
    }>;
  } | null;

  posts: Array<{
    media: Array<{
      type: "IMAGE" | "VIDEO";
      url: string;
      feedUrl: string | null;
      posterUrl: string | null;
    }>;
  }>;

  _count: {
    posts: number;
    followers: number;
  };

  mediaCounts: {
    images: number;
    videos: number;
  };
};

type CreatorCardProps = {
  creator: CreatorCardData;
  priority?: boolean;
};

export function CreatorCard({ creator, priority = false }: CreatorCardProps) {
  const displayName = creator.profile?.displayName ?? creator.name ?? creator.username;

  const firstMedia = creator.posts[0]?.media[0];

  const previewUrl =
    firstMedia?.type === "VIDEO" ? (firstMedia.posterUrl ?? firstMedia.feedUrl ?? firstMedia.url) : (firstMedia?.feedUrl ?? firstMedia?.url ?? creator.image);

  const location = [creator.profile?.city, creator.profile?.canton].filter(Boolean).join(", ");

  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/30 hover:shadow-2xl hover:shadow-rose-950/20">
      <Link href={`/profile/${creator.username}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-zinc-900">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={displayName}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-rose-500/25 via-fuchsia-500/10 to-zinc-900">
              <span className="text-5xl font-black text-rose-300/50">{displayName.slice(0, 1).toUpperCase()}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent transition-all duration-300 group-hover:from-black group-hover:via-black/30" />

          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-bold text-white">{displayName}</h2>

              {creator.profile?.verified && <BadgeCheck className="size-4 shrink-0 text-sky-400" />}
            </div>

            <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-zinc-300">
              {location ? (
                <>
                  <MapPin className="size-3.5 shrink-0 text-rose-400" />
                  <span className="truncate">
                    {location}
                    <span className="mx-1 text-zinc-500">·</span>@{creator.username}
                  </span>
                </>
              ) : (
                <>@{creator.username}</>
              )}
            </p>

            {creator.profile?.categories.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {creator.profile.categories.slice(0, 2).map(({ category }) => (
                  <span
                    key={category.slug}
                    className="rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <Camera className="size-3.5" />
            {creator.mediaCounts.images}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Video className="size-3.5" />
            {creator.mediaCounts.videos}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <UsersRound className="size-3.5" />
            {creator._count.followers}
          </span>
        </div>
      </Link>
    </article>
  );
}
