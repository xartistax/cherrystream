import { ArrowLeft, BadgeCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/profile-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Profil bearbeiten",
};

export default async function EditProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user, categories, cantonOptions, cityOptions] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        image: true,
        profile: {
          select: {
            displayName: true,
            bio: true,
            birthDate: true,
            gender: true,
            isPublic: true,
            coverUrl: true,
            website: true,
            instagram: true,
            verified: true,
            cantonId: true,
            cityId: true,
            categories: {
              select: {
                categoryId: true,
              },
            },
          },
        },
      },
    }),

    prisma.category.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),

    prisma.canton.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),

    prisma.city.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        cantonId: true,
      },
      orderBy: [
        {
          canton: {
            sortOrder: "asc",
          },
        },
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  const displayName = user.profile?.displayName ?? user.name ?? user.username;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/studio"
            aria-label="Zurück zum Studio"
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
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Profil bearbeiten</h1>

              {user.profile?.verified ? (
                <Badge className="gap-1 bg-sky-500/15 text-sky-300 hover:bg-sky-500/15">
                  <BadgeCheck className="size-3.5" />
                  Verifiziert
                </Badge>
              ) : null}
            </div>

            <p className="mt-1 text-sm text-zinc-500">Passe dein öffentliches CherryStream-Profil an.</p>
          </div>
        </div>

        <Link
          href={`/profile/${user.username}`}
          className={cn(
            buttonVariants({
              variant: "outline",
            }),
            "border-white/10 bg-white/5 text-white hover:bg-white/10",
          )}
        >
          <UserRound className="size-4" />
          Öffentliches Profil
        </Link>
      </div>

      <Card className="overflow-hidden border-white/10 bg-zinc-900/70 text-white shadow-2xl shadow-black/20 backdrop-blur-xl">
        <CardHeader className="border-b border-white/10">
          <CardTitle>{displayName}</CardTitle>

          <CardDescription className="text-zinc-500">
            @{user.username} · {user.email}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <ProfileForm
            user={{
              id: user.id,
              username: user.username,
              email: user.email,
              image: user.image,
              displayName,
              bio: user.profile?.bio ?? "",
              birthDate: user.profile?.birthDate ? user.profile.birthDate.toISOString().slice(0, 10) : "",
              gender: user.profile?.gender ?? null,
              isPublic: user.profile?.isPublic ?? true,
              coverUrl: user.profile?.coverUrl ?? null,
              website: user.profile?.website ?? "",
              instagram: user.profile?.instagram ?? "",
              categoryIds: user.profile?.categories.map((item) => item.categoryId) ?? [],
              cantonId: user.profile?.cantonId ?? null,
              cityId: user.profile?.cityId ?? null,
            }}
            categories={categories}
            cantonOptions={cantonOptions}
            cityOptions={cityOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
