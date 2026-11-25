"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ContactCard } from "@/components/profile/contact-card";
import { FavoriteButton } from "@/components/profile/favorite-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ContactChannel = "PHONE" | "WHATSAPP" | "TELEGRAM" | "SIGNAL" | "WEBSITE" | "INSTAGRAM" | "EMAIL";

type StickyProfileHeaderProps = {
  triggerId: string;
  username: string;
  displayName: string;
  image: string | null;
  location: string;
  categories: Array<{
    name: string;
    slug: string;
  }>;
  authenticated: boolean;
  initialFavorite: boolean;
  isOwnProfile: boolean;
  contactProfile: {
    phoneEnabled: boolean;
    whatsappEnabled: boolean;
    telegramEnabled: boolean;
    signalEnabled: boolean;
    websiteEnabled: boolean;
    instagramEnabled: boolean;
    emailEnabled: boolean;
    preferredContact: ContactChannel | null;
  };
};

export function StickyProfileHeader({
  triggerId,
  username,
  displayName,
  image,
  location,
  categories,
  authenticated,
  initialFavorite,
  isOwnProfile,
  contactProfile,
}: StickyProfileHeaderProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const trigger = document.getElementById(triggerId);

    if (!trigger) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: "-112px 0px 0px 0px",
      },
    );

    observer.observe(trigger);

    return () => {
      observer.disconnect();
    };
  }, [triggerId]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl transition duration-300",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href={`/profile/${username}`} className="flex min-w-0 items-center gap-3">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-zinc-900">
            {image ? (
              <Image src={image} alt={displayName} fill sizes="44px" className="object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center bg-rose-500/10 text-sm font-bold text-rose-300">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{displayName}</p>

            <p className="truncate text-xs text-zinc-500">{location || `@${username}`}</p>
          </div>
        </Link>

        {categories.length > 0 ? (
          <div className="hidden min-w-0 flex-1 flex-wrap gap-2 lg:flex">
            {categories.slice(0, 3).map((category) => (
              <Link key={category.slug} href={`/explore?category=${category.slug}`}>
                <Badge variant="secondary" className="border border-rose-500/20 bg-rose-500/10 text-rose-300">
                  {category.name}
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {!isOwnProfile ? (
            <FavoriteButton username={username} authenticated={authenticated} initialFavorite={initialFavorite} compact />
          ) : null}

          <div className="hidden sm:block">
            <ContactCard username={username} disabled={isOwnProfile} profile={contactProfile} />
          </div>
        </div>
      </div>
    </div>
  );
}
