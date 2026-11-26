import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { ModelLocationForm } from "@/components/become-model/model-location-form";

export const metadata = {
  title: "Standort einrichten",
};

export default async function BecomeModelLocationPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role === "MODEL" || session.user.role === "ADMIN") {
    redirect("/dashboard");
  }

  const [profile, cantonOptions, cityOptions] = await Promise.all([
    prisma.profile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        cantonId: true,
        cityId: true,
      },
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

  if (!profile) {
    redirect("/become-model/profile");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8 sm:py-12">
      <header className="flex items-center gap-4">
        <Link
          href="/become-model/profile"
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
          <p className="text-sm font-medium text-rose-400">Schritt 2 von 3</p>

          <h1 className="text-2xl font-black tracking-tight text-white">Dein Standort</h1>
        </div>
      </header>

      <Card className="border-white/10 bg-zinc-900/70 text-white shadow-2xl shadow-black/20">
        <CardHeader className="border-b border-white/10 bg-white/[0.02]">
          <div className="flex size-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
            <MapPin className="size-5" />
          </div>

          <CardTitle className="mt-3">Wo empfängst du oder bist du unterwegs?</CardTitle>

          <CardDescription className="leading-6 text-zinc-500">
            Wähle Kanton und Ort. So finden dich Kunden in deiner Region.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <ModelLocationForm defaultCantonId={profile.cantonId} defaultCityId={profile.cityId} cantonOptions={cantonOptions} cityOptions={cityOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
