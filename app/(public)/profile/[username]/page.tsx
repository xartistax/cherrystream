import { notFound } from "next/navigation";
import Image from "next/image";

import { paymentsEnabled } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ProfileGallery } from "@/components/profile/gallery/profile-gallery";
import { ReportButton } from "@/components/reports/report-button";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "@/components/profile/favorite-button";
import { auth } from "@/lib/auth";
import { trackProfileView } from "@/lib/analytics/track-profile-view";
import { ContactCard } from "@/components/profile/contact-card";
import { StickyProfileHeader } from "@/components/profile/sticky-profile-header";
import { ProfileDescription } from "@/components/profile/profile-description";
import { BadgeCheck, CalendarDays, Camera, MapPin, Video } from "lucide-react";

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;

  return {
    title: `${username} • CherryStream`,
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const session = await auth();
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: {
      username,
      status: "ACTIVE",
      role: "MODEL",
      modelStatus: "ACTIVE",
    },

    select: {
      id: true,
      username: true,
      image: true,
      createdAt: true,

      profile: {
        select: {
          displayName: true,
          bio: true,
          isPublic: true,
          coverUrl: true,
          verified: true,

          phoneEnabled: true,
          whatsappEnabled: true,

          telegramEnabled: true,
          signalEnabled: true,

          websiteEnabled: true,
          instagramEnabled: true,
          emailEnabled: true,

          preferredContact: true,
          contactNote: true,

          city: {
            select: {
              name: true,
              slug: true,
            },
          },

          canton: {
            select: {
              name: true,
              slug: true,
            },
          },

          categories: {
            orderBy: {
              category: {
                sortOrder: "asc",
              },
            },
            select: {
              category: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      },

      posts: {
        where: {
          status: "PUBLISHED",
          ...(paymentsEnabled ? {} : { visibility: { not: "PREMIUM" } }),
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          visibility: true,
          unlockPrice: true,

          media: {
            where: {
              status: "READY",
            },
            orderBy: {
              sortOrder: "asc",
            },
            select: {
              id: true,
              type: true,
              profileUrl: true,
              url: true,
              feedUrl: true,
              fullUrl: true,
              posterUrl: true,
            },
          },

          unlocks: {
            where: {
              userId: session?.user?.id ?? "",
            },
            select: {
              id: true,
            },
            take: 1,
          },
        },
      },

      _count: {
        select: {
          posts: {
            where: {
              status: "PUBLISHED",
            },
          },
        },
      },
    },
  });

  if (!user || !user.profile?.isPublic) {
    notFound();
  }

  await trackProfileView(user.id);

  const isOwnProfile = session?.user?.id === user.id;

  // Favorites are stored in the Follow table; only the visitor sees whether they marked this profile.
  const existingFollow =
    session?.user?.id && !isOwnProfile
      ? await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: session.user.id,
              followingId: user.id,
            },
          },
          select: {
            followerId: true,
          },
        })
      : null;

  const initialFavorite = existingFollow !== null;

  const displayName = user.profile.displayName ?? user.username;
  const location = [user.profile.city?.name, user.profile.canton?.name]

    .filter(Boolean)

    .join(", ");

  const galleryMedia = user.posts.flatMap((post) => {
    const unlocked = isOwnProfile || post.visibility !== "PREMIUM" || post.unlocks.length > 0;

    return post.media.flatMap((media) => {
      const lockedPreviewUrl = media.type === "VIDEO" ? media.posterUrl : media.profileUrl;

      if (!unlocked) {
        if (!lockedPreviewUrl) {
          return [];
        }

        return [
          {
            id: media.id,
            postId: post.id,
            type: media.type,
            url: lockedPreviewUrl,
            feedUrl: null,
            fullUrl: null,
            posterUrl: media.posterUrl,
            visibility: post.visibility,
            unlockPrice: post.unlockPrice,
            unlocked: false,
          },
        ];
      }

      return [
        {
          id: media.id,
          postId: post.id,
          type: media.type,
          url: media.url,
          feedUrl: media.feedUrl,
          fullUrl: media.fullUrl,
          posterUrl: media.posterUrl,
          visibility: post.visibility,
          unlockPrice: post.unlockPrice,
          unlocked: true,
        },
      ];
    });
  });

  const photoCount = galleryMedia.filter((media) => media.type === "IMAGE").length;
  const videoCount = galleryMedia.length - photoCount;
  const memberSince = new Intl.DateTimeFormat("de-CH", { month: "short", year: "numeric" }).format(user.createdAt);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <StickyProfileHeader
        triggerId="profile-header-end"
        username={user.username}
        displayName={displayName}
        image={user.image}
        location={location}
        categories={user.profile.categories.map(({ category }) => ({
          name: category.name,
          slug: category.slug,
        }))}
        authenticated={Boolean(session?.user?.id)}
        initialFavorite={initialFavorite}
        isOwnProfile={isOwnProfile}
        contactProfile={{
          phoneEnabled: user.profile.phoneEnabled,
          whatsappEnabled: user.profile.whatsappEnabled,
          telegramEnabled: user.profile.telegramEnabled,
          signalEnabled: user.profile.signalEnabled,
          websiteEnabled: user.profile.websiteEnabled,
          instagramEnabled: user.profile.instagramEnabled,
          emailEnabled: user.profile.emailEnabled,
          preferredContact: user.profile.preferredContact,
        }}
      />

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/80 shadow-2xl shadow-black/20">
        <div className="relative h-56 overflow-hidden bg-linear-to-br from-rose-600 via-pink-600 to-fuchsia-700 sm:h-72">
          {user.profile.coverUrl ? (
            <Image
              src={user.profile.coverUrl}
              alt={`Cover von ${displayName}`}
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
          ) : null}

          <div className="absolute inset-0 bg-linear-to-t from-zinc-900 via-black/30 to-transparent" />
        </div>

        <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-16 flex flex-col gap-6 sm:-mt-20 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <Avatar className="size-32 border-4 border-zinc-900 bg-zinc-900 shadow-2xl sm:size-40">
                <AvatarImage src={user.image ?? undefined} alt={displayName} />

                <AvatarFallback className="bg-rose-500/15 text-2xl font-bold text-rose-300">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-3xl font-black tracking-tight text-white sm:text-4xl">{displayName}</h1>

                  {user.profile.verified ? <BadgeCheck className="size-6 shrink-0 text-sky-400" /> : null}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
                  <span>@{user.username}</span>

                  {location ? (
                    <>
                      <span className="text-zinc-600">•</span>

                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-4 text-rose-400" />
                        {location}
                      </span>
                    </>
                  ) : null}
                </div>

                {user.profile.categories.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {user.profile.categories.map(({ category }) => (
                      <Link key={category.slug} href={`/explore?category=${category.slug}`}>
                        <Badge
                          variant="secondary"
                          className="cursor-pointer rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-500/20"
                        >
                          {category.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:min-w-80">
              {[
                { icon: Camera, value: String(photoCount), label: photoCount === 1 ? "Foto" : "Fotos" },
                { icon: Video, value: String(videoCount), label: videoCount === 1 ? "Video" : "Videos" },
                { icon: CalendarDays, value: memberSince, label: "Dabei seit" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
                  <stat.icon className="mx-auto mb-1.5 size-4 text-rose-400" />

                  <div className="text-xl font-black text-white">{stat.value}</div>

                  <div className="mt-1 text-xs text-zinc-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            {isOwnProfile ? (
              <Link href="/profile/edit" className={cn(buttonVariants(), "bg-rose-600 text-white hover:bg-rose-500")}>
                Profil bearbeiten
              </Link>
            ) : null}

            <ContactCard
              username={user.username}
              disabled={isOwnProfile}
              profile={{
                phoneEnabled: user.profile.phoneEnabled,
                whatsappEnabled: user.profile.whatsappEnabled,
                telegramEnabled: user.profile.telegramEnabled,
                signalEnabled: user.profile.signalEnabled,
                websiteEnabled: user.profile.websiteEnabled,
                instagramEnabled: user.profile.instagramEnabled,
                emailEnabled: user.profile.emailEnabled,
                preferredContact: user.profile.preferredContact,
              }}
            />

            {!isOwnProfile ? (
              <FavoriteButton username={user.username} authenticated={Boolean(session?.user?.id)} initialFavorite={initialFavorite} />
            ) : null}
          </div>

          {!isOwnProfile ? <ReportButton username={user.username} label="Profil melden" className="mt-5" /> : null}

          {!isOwnProfile && user.profile.contactNote ? (
            <div className="mt-5 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-sm leading-6 text-zinc-400">{user.profile.contactNote}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div id="profile-header-end" aria-hidden="true" className="h-px" />

      {user.profile.bio ? <ProfileDescription html={user.profile.bio} displayName={displayName} /> : null}

      <ProfileGallery
        displayName={displayName}
        username={user.username}
        canReport={!isOwnProfile}
        media={galleryMedia}
        authenticated={Boolean(session?.user?.id)}
        loginUrl={`/login?callbackUrl=${encodeURIComponent(`/profile/${user.username}`)}`}
      />
    </div>
  );
}
