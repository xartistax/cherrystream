"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deletePostAction } from "@/actions/delete-post";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type DeletePostDialogProps = {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeletePostDialog({ postId, open, onOpenChange }: DeletePostDialogProps) {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);

    startTransition(async () => {
      const result = await deletePostAction(postId);

      if (!result.success) {
        setError(result.message ?? "Der Inhalt konnte nicht gelöscht werden.");
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          setError(null);
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="border-white/10 bg-zinc-950 text-white sm:max-w-md">
        <DialogHeader>
          <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
            <Trash2 className="size-5" />
          </div>

          <DialogTitle className="pt-2">Inhalt löschen?</DialogTitle>

          <DialogDescription className="text-zinc-500">
            Der Beitrag und alle zugehörigen Medien werden dauerhaft entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <DialogClose
            render={<Button type="button" variant="outline" disabled={isPending} className="border-white/10 bg-white/5 text-white hover:bg-white/10" />}
          >
            Abbrechen
          </DialogClose>

          <Button type="button" variant="destructive" disabled={isPending} onClick={handleDelete}>
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}

            {isPending ? "Wird gelöscht ..." : "Endgültig löschen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
