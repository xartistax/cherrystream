"use client";

import { CircleUserRound, EyeOff, ExternalLink, Images, LoaderCircle, LockKeyhole, MoreHorizontal, Play, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteGalleryItemAction, setProfileImageAction } from "@/actions/gallery";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type GalleryItem = {
  id: string;
  type: "IMAGE" | "VIDEO";
  previewUrl: string | null;
  isProfileImage: boolean;
  hidden: boolean;
  premium: boolean;
};

type GalleryManagerProps = {
  items: GalleryItem[];
  username: string;
};

function ItemMenu({ item, username, onDelete, onError }: { item: GalleryItem; username: string; onDelete: () => void; onError: (message: string) => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const canBeProfileImage = item.type === "IMAGE" && !item.isProfileImage && !item.hidden;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isPending}
            aria-label="Optionen öffnen"
            className="size-9 rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"
          />
        }
      >
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 border-white/10 bg-zinc-950 text-zinc-200">
        {canBeProfileImage ? (
          <DropdownMenuItem
            onClick={() => {
              startTransition(async () => {
                const result = await setProfileImageAction(item.id);

                if (!result.success) {
                  onError(result.message ?? "Das Profilbild konnte nicht geändert werden.");
                  return;
                }

                router.refresh();
              });
            }}
            className="cursor-pointer focus:bg-white/5 focus:text-white"
          >
            <CircleUserRound className="size-4" />
            Als Profilbild festlegen
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuItem render={<Link href={`/profile/${username}`} target="_blank" />} className="cursor-pointer focus:bg-white/5 focus:text-white">
          <ExternalLink className="size-4" />
          Im Inserat ansehen
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-rose-400 focus:bg-rose-500/10 focus:text-rose-300">
          <Trash2 className="size-4" />
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function GalleryManager({ items, username }: GalleryManagerProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDeleting] = useTransition();

  if (items.length === 0) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 px-6 text-center">
        <Images className="size-8 text-zinc-600" />

        <p className="mt-4 font-semibold text-white">Noch keine Fotos oder Videos</p>

        <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500">Dein erstes hochgeladenes Foto wird automatisch dein Profilbild. Du kannst es jederzeit ändern.</p>
      </div>
    );
  }

  return (
    <>
      {error ? (
        <p role="alert" className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
            {item.previewUrl ? (
              <Image
                src={item.previewUrl}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={item.hidden ? "object-cover opacity-40 grayscale" : "object-cover"}
              />
            ) : (
              <div className="flex size-full items-center justify-center text-zinc-700">
                <Images className="size-8" />
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap gap-1.5 p-2">
              {item.isProfileImage ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                  <CircleUserRound className="size-3" />
                  Profilbild
                </span>
              ) : null}

              {item.type === "VIDEO" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[11px] text-white">
                  <Play className="size-3 fill-current" />
                  Video
                </span>
              ) : null}

              {item.premium ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[11px] font-semibold text-black">
                  <LockKeyhole className="size-3" />
                  Premium
                </span>
              ) : null}

              {item.hidden ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300">
                  <EyeOff className="size-3" />
                  Ausgeblendet
                </span>
              ) : null}
            </div>

            <div className="absolute right-2 bottom-2">
              <ItemMenu
                item={item}
                username={username}
                onError={setError}
                onDelete={() => {
                  setError(null);
                  setDeleteTarget(item);
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="border-white/10 bg-zinc-950 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{deleteTarget?.type === "VIDEO" ? "Video löschen?" : "Foto löschen?"}</DialogTitle>

            <DialogDescription className="text-zinc-500">
              Die Datei wird dauerhaft entfernt.
              {deleteTarget?.isProfileImage ? " Sie ist dein Profilbild, danach wird automatisch dein ältestes Foto verwendet." : ""}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={isDeleting} className="border-white/10 bg-white/5 text-white hover:bg-white/10" />}>
              Abbrechen
            </DialogClose>

            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                if (!deleteTarget) {
                  return;
                }

                startDeleting(async () => {
                  const result = await deleteGalleryItemAction(deleteTarget.id);

                  if (!result.success) {
                    setError(result.message ?? "Das Element konnte nicht gelöscht werden.");
                  }

                  setDeleteTarget(null);
                  router.refresh();
                });
              }}
            >
              {isDeleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
