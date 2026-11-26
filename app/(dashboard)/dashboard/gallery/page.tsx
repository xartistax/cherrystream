import { ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { GalleryManager } from "@/components/gallery/gallery-manager";
import { GalleryUploader } from "@/components/gallery/gallery-uploader";
import { buttonVariants } from "@/components/ui/button";
import { requireCreatorPage } from "@/lib/access";
import { getGalleryItems } from "@/lib/gallery/get-gallery-items";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Fotos & Videos",
};

export default async function GalleryPage() {
  const { userId, modelStatus } = await requireCreatorPage();
  const isPublished = modelStatus === "ACTIVE";

  const [user, items] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        username: true,
      },
    }),
    getGalleryItems(userId),
  ]);

  const photoCount = items.filter((item) => item.type === "IMAGE").length;
  const videoCount = items.length - photoCount;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Fotos & Videos</h1>

          <p className="mt-2 text-sm text-zinc-500">
            {photoCount} {photoCount === 1 ? "Foto" : "Fotos"} · {videoCount} {videoCount === 1 ? "Video" : "Videos"}. Das markierte Foto ist dein Profilbild.
          </p>
        </div>

        {isPublished ? (
          <Link href={`/profile/${user.username}`} className={cn(buttonVariants({ variant: "outline" }), "border-white/10 bg-white/5 text-white hover:bg-white/10")}>
            <ExternalLink className="size-4" />
            Inserat ansehen
          </Link>
        ) : null}
      </header>

      {isPublished ? (
        <GalleryUploader userId={userId} />
      ) : (
        <Link
          href="/dashboard/verification"
          className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100 transition hover:bg-amber-500/15"
        >
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-300" />
          Sobald dein Inserat freigegeben ist, kannst du hier Fotos und Videos hochladen.
        </Link>
      )}

      <GalleryManager items={items} username={user.username} />
    </div>
  );
}
