import { Cherry, Database, Layers3, Palette } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

const technologies = [
  {
    name: "Next.js",
    description: "App Router und Server Components",
    icon: Layers3,
  },
  {
    name: "Tailwind CSS",
    description: "Modernes, responsives Styling",
    icon: Palette,
  },
  {
    name: "shadcn/ui",
    description: "Wiederverwendbare UI-Komponenten",
    icon: Cherry,
  },
  {
    name: "Neon + Prisma",
    description: "Serverless PostgreSQL",
    icon: Database,
  },
];

export default async function HomePage() {
  const userCount = await prisma.user.count();

  return (
    <main className="relative min-h-svh overflow-hidden bg-zinc-950 px-6 py-16 text-white">
      <div className="absolute inset-x-0 top-0 -z-0 h-96 bg-[radial-gradient(circle_at_top,#e11d4860,transparent_60%)]" />

      <div className="relative mx-auto flex max-w-5xl flex-col gap-10">
        <header className="space-y-5 text-center">
          <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-300">
            Datenbank verbunden · {userCount} User
          </Badge>

          <div className="space-y-3">
            <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
              Cherry
              <span className="bg-linear-to-r from-rose-500 to-pink-400 bg-clip-text text-transparent">Stream</span>
            </h1>

            <p className="mx-auto max-w-xl text-lg text-zinc-400">
              Das technische Grundgerüst steht. Bereit für Authentifizierung, Profile, Medien und Credits.
            </p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {technologies.map((technology) => {
            const Icon = technology.icon;

            return (
              <Card key={technology.name} className="border-white/10 bg-white/5 text-white backdrop-blur-xl">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
                    <Icon className="size-5" />
                  </div>

                  <CardTitle>{technology.name}</CardTitle>
                  <CardDescription className="text-zinc-400">{technology.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">Aktiv</Badge>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
