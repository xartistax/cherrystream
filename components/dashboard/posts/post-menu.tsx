"use client";

import { Copy, ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { DeletePostDialog } from "@/components/dashboard/posts/delete-post-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type PostMenuProps = {
  postId: string;
  username: string;
  disabled?: boolean;
};

export function PostMenu({ postId, username, disabled = false }: PostMenuProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              aria-label="Beitragsoptionen öffnen"
              className="size-9 rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52 border-white/10 bg-zinc-950 text-zinc-200">
          <DropdownMenuItem render={<Link href={`/dashboard/posts/${postId}`} />} className="cursor-pointer focus:bg-white/5 focus:text-white">
            <Pencil className="size-4" />
            Bearbeiten
          </DropdownMenuItem>

          <DropdownMenuItem render={<Link href={`/profile/${username}?post=${postId}`} />} className="cursor-pointer focus:bg-white/5 focus:text-white">
            <ExternalLink className="size-4" />
            Öffentlich ansehen
          </DropdownMenuItem>

          <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
            <Copy className="size-4" />
            Duplizieren
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-white/10" />

          <DropdownMenuItem
            onClick={() => {
              setDeleteDialogOpen(true);
            }}
            className="cursor-pointer text-rose-400 focus:bg-rose-500/10 focus:text-rose-300"
          >
            <Trash2 className="size-4" />
            Löschen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeletePostDialog postId={postId} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />
    </>
  );
}
