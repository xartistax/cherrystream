"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, useRef, useState, useTransition } from "react";

import { createPostAction } from "@/actions/create-post";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ComposerUser } from "./types";
import { MediaPreview } from "./media-preview";
import { UploadProgress } from "./upload-progress";
import { Toolbar } from "./toolbar";
import { useUpload } from "./use-upload";

type ComposerProps = {
  user: ComposerUser;
};

function getInitials(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CreatePostComposer({ user }: ComposerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const { files, progress, error, setError, addFiles, removeFile, uploadFiles, reset } = useUpload({
    userId: user.id,
  });

  const isUploading = progress !== null && progress < 100;
  const isBusy = isPending || isUploading;

  const canSubmit = !isBusy && files.length > 0;

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);

    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    await addFiles(selectedFiles);
  }

  async function handleSubmit() {
    const normalizedContent = content.trim();

    if (files.length === 0) {
      setError("Füge mindestens ein Bild oder Video hinzu.");
      return;
    }

    setError(null);

    try {
      const uploadedMedia = await uploadFiles();

      startTransition(async () => {
        const result = await createPostAction({
          content: normalizedContent,
          media: uploadedMedia,
        });

        if (!result.success) {
          setError(result.message ?? "Der Beitrag konnte nicht erstellt werden.");
          return;
        }

        reset();
        setContent("");
        router.refresh();
      });
    } catch (uploadError) {
      console.error("Media upload failed:", uploadError);

      setError("Der Upload ist fehlgeschlagen.");
    }
  }

  return (
    <Card className="overflow-hidden border-white/10 bg-zinc-900/70 text-white shadow-xl shadow-black/10 backdrop-blur">
      <CardContent className="p-4 sm:p-5">
        <div className="flex gap-3">
          <Avatar className="size-11 shrink-0 border border-white/10">
            <AvatarImage src={user.image ?? undefined} alt={user.displayName} />

            <AvatarFallback className="bg-rose-500/15 text-rose-300">{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>

          <Textarea
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
            }}
            disabled={isBusy}
            maxLength={2000}
            placeholder="Beschreibung hinzufügen ..."
            className="min-h-24 resize-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
          />
        </div>

        <MediaPreview files={files} disabled={isBusy} onRemove={removeFile} />

        <UploadProgress progress={progress} />

        {error ? (
          <p role="alert" className="mt-4 text-sm text-rose-400">
            {error}
          </p>
        ) : null}

        <Toolbar
          inputRef={fileInputRef}
          fileCount={files.length}
          disabled={isBusy}
          canSubmit={canSubmit}
          isSubmitting={isBusy}
          onFileChange={handleFileSelection}
          onSubmit={handleSubmit}
        />
      </CardContent>
    </Card>
  );
}
