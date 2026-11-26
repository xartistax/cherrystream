import { Heart } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CreatorCard } from "@/components/public/creator-card";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { creatorCardSelect, toCreatorCards } from "@/lib/creators/creator-cards";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Meine Favoriten",
};

export default async function FavoritesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Ffavorites");
  }

  // Favorites live in the Follow table; only profiles that are currently public are shown.
  const creators = await prisma.user.findMany({
    where: {
      followers: {
        some: {
          followerId: session.user.id,
        },
      },
      status: "ACTIVE",
      role: "MODEL",
      modelStatus: "ACTIVE",
      profile: {
        is: {
          isPublic: true,
        },
      },
    },
    select: creatorCardSelect,
    orderBy: {
      createdAt: "desc",
    },
  });

  const cards = await toCreatorCards(creators);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Meine Favoriten</h1>

        <p className="mt-2 text-sm text-zinc-500">Inserate, die du dir gemerkt hast. Nur du siehst diese Liste.</p>
      </header>

      {cards.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 px-6 text-center">
          <Heart className="size-8 text-zinc-600" />

          <p className="mt-4 font-semibold text-white">Noch keine Favoriten</p>

          <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500">Tippe in einem Inserat auf «Merken», um es hier wiederzufinden.</p>

          <Link href="/explore" className={cn(buttonVariants(), "mt-6 bg-rose-600 text-white hover:bg-rose-500")}>
            Inserate entdecken
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((creator) => (
            <CreatorCard key={creator.username} creator={creator} />
          ))}
        </div>
      )}
    </div>
  );
}
