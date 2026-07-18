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
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Input } from "@base-ui/react";
import { Globe2, Users, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

type ComposerProps = {
  user: ComposerUser;
};
type PostVisibility = "PUBLIC" | "FOLLOWERS" | "PREMIUM";

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
  const [visibility, setVisibility] = useState<PostVisibility>("PUBLIC");
  const [unlockPrice, setUnlockPrice] = useState("");

  const { files, progress, error, setError, addFiles, removeFile, uploadFiles, reset } = useUpload({
    userId: user.id,
  });

  const isUploading = progress !== null && progress < 100;
  const isBusy = isPending || isUploading;

  const premiumPrice = Number(unlockPrice);

  const hasValidPremiumPrice = visibility !== "PREMIUM" || (Number.isSafeInteger(premiumPrice) && premiumPrice > 0);

  const canSubmit = !isBusy && files.length > 0 && hasValidPremiumPrice;

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
    let normalizedUnlockPrice: number | null = null;

    if (visibility === "PREMIUM") {
      const price = Number(unlockPrice);

      if (!Number.isSafeInteger(price) || price <= 0) {
        setError("Gib einen gültigen Premium-Preis ein.");
        return;
      }

      normalizedUnlockPrice = price;
    }

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
          visibility,
          unlockPrice: normalizedUnlockPrice,
          media: uploadedMedia,
        });

        if (!result.success) {
          setError(result.message ?? "Der Beitrag konnte nicht erstellt werden.");
          return;
        }

        reset();
        setContent("");
        setVisibility("PUBLIC");
        setUnlockPrice("");
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

        <div className="mt-5 space-y-3">
          <Label className="text-sm text-zinc-300">Sichtbarkeit</Label>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => {
                setVisibility("PUBLIC");
                setUnlockPrice("");
              }}
              className={cn(
                "justify-start border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.07] hover:text-white",
                visibility === "PUBLIC" && "border-rose-500/40 bg-rose-500/10 text-rose-300",
              )}
            >
              <Globe2 className="size-4" />
              Öffentlich
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => {
                setVisibility("FOLLOWERS");
                setUnlockPrice("");
              }}
              className={cn(
                "justify-start border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.07] hover:text-white",
                visibility === "FOLLOWERS" && "border-rose-500/40 bg-rose-500/10 text-rose-300",
              )}
            >
              <Users className="size-4" />
              Follower
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => {
                setVisibility("PREMIUM");
              }}
              className={cn(
                "justify-start border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.07] hover:text-white",
                visibility === "PREMIUM" && "border-amber-500/40 bg-amber-500/10 text-amber-300",
              )}
            >
              <LockKeyhole className="size-4" />
              Premium
            </Button>
          </div>

          {visibility === "PREMIUM" ? (
            <div className="max-w-xs space-y-2">
              <Label htmlFor="unlock-price" className="text-sm text-zinc-300">
                Freischaltpreis in Credits
              </Label>

              <Input
                id="unlock-price"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={unlockPrice}
                disabled={isBusy}
                onChange={(event) => {
                  setUnlockPrice(event.target.value);
                }}
                placeholder="Zum Beispiel 25"
                className="border-white/10 bg-white/[0.03] text-white"
              />
            </div>
          ) : null}
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
