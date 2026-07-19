import { Cherry, Compass, UserRoundPlus } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyFeed() {
  return (
    <Card className="border-dashed border-white/10 bg-zinc-900/40 text-white">
      <CardContent className="flex flex-col items-center px-6 py-14 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-rose-500/30 blur-2xl" />

          <div className="relative flex size-16 items-center justify-center rounded-2xl bg-linear-to-br from-rose-500 to-pink-600 shadow-xl shadow-rose-950/40">
            <Cherry className="size-7" />
          </div>
        </div>

        <h2 className="text-xl font-bold">Dein Feed wartet auf Leben</h2>

        <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
          Entdecke interessante Profile und folge Menschen, um ihre Beiträge später hier zu sehen.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/explore"
            className={buttonVariants({
              variant: "default",
            })}
          >
            <Compass />
            Profile entdecken
          </Link>

          <Link
            href="/profile"
            className={buttonVariants({
              variant: "default",
            })}
          >
            <UserRoundPlus />
            Profil vervollständigen
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
