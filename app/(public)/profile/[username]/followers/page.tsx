import { ArrowLeft, MapPin, UsersRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FollowButton } from "@/components/profile/follow-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type FollowersPageProps = {
  params: Promise<{
    username: string;
  }>;
};

function getInitials(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function FollowersPage({ params }: FollowersPageProps) {
  const session = await auth();
  const { username } = await params;

  const profileUser = await prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      username: true,
      name: true,
      profile: {
        select: {
          displayName: true,
          isPublic: true,
        },
      },
      _count: {
        select: {
          followers: true,
        },
      },
      followers: {
        where: {
          follower: {
            status: "ACTIVE",
            profile: {
              is: {
                isPublic: true,
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
        select: {
          createdAt: true,
          follower: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
              profile: {
                select: {
                  displayName: true,
                  city: {
                    select: {
                      name: true,
                    },
                  },
                  canton: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  followers: true,
                },
              },
              ...(session?.user?.id
                ? {
                    followers: {
                      where: {
                        followerId: session.user.id,
                      },
                      select: {
                        followerId: true,
                      },
                      take: 1,
                    },
                  }
                : {}),
            },
          },
        },
      },
    },
  });

  if (!profileUser?.profile?.isPublic) {
    notFound();
  }

  const displayName = profileUser.profile.displayName ?? profileUser.name ?? profileUser.username;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex items-start gap-4">
        <Link
          href={`/profile/${profileUser.username}`}
          aria-label="Zurück zum Profil"
          className={cn(
            buttonVariants({
              variant: "outline",
              size: "icon",
            }),
            "shrink-0 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white",
          )}
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-white">Follower</h1>

            <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-400">
              {profileUser._count.followers}
            </Badge>
          </div>

          <p className="mt-2 text-sm text-zinc-500">Personen, die {displayName} folgen.</p>
        </div>
      </header>

      {profileUser.followers.length > 0 ? (
        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60">
          {profileUser.followers.map(({ follower }, index) => {
            const followerDisplayName = follower.profile?.displayName ?? follower.name ?? follower.username;

            const location = [follower.profile?.city?.name, follower.profile?.canton?.name].filter((value): value is string => Boolean(value)).join(", ");

            const isOwnProfile = session?.user?.id === follower.id;

            const initialFollowing = "followers" in follower && follower.followers.length > 0;

            return (
              <article key={follower.id} className={cn("flex flex-col gap-4 p-5 sm:flex-row sm:items-center", index > 0 && "border-t border-white/10")}>
                <Link href={`/profile/${follower.username}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <Avatar className="size-14 shrink-0 border border-white/10">
                    <AvatarImage src={follower.image ?? undefined} alt={followerDisplayName} />

                    <AvatarFallback className="bg-rose-500/10 text-rose-300">{getInitials(followerDisplayName)}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white hover:text-rose-300">{followerDisplayName}</p>

                    <p className="mt-0.5 truncate text-sm text-zinc-500">@{follower.username}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                      {location ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-rose-400" />
                          {location}
                        </span>
                      ) : null}

                      <span className="inline-flex items-center gap-1.5">
                        <UsersRound className="size-3.5" />
                        {follower._count.followers} Follower
                      </span>
                    </div>
                  </div>
                </Link>

                {isOwnProfile ? (
                  <Link
                    href={`/profile/${follower.username}`}
                    className={cn(
                      buttonVariants({
                        variant: "outline",
                      }),
                      "border-white/10 bg-white/5 text-white hover:bg-white/10",
                    )}
                  >
                    Dein Profil
                  </Link>
                ) : (
                  <FollowButton
                    username={follower.username}
                    authenticated={Boolean(session?.user?.id)}
                    initialFollowing={initialFollowing}
                    initialFollowerCount={follower._count.followers}
                  />
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
            <UsersRound className="size-6" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-white">Noch keine Follower</h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">Sobald jemand diesem Profil folgt, erscheint die Person hier.</p>
        </div>
      )}
    </main>
  );
}
