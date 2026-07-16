"use client";

import { ImagePlus, Video } from "lucide-react";
import { type ChangeEvent, type RefObject } from "react";

import { Button } from "@/components/ui/button";
import { MAX_POST_FILES } from "@/lib/media";

type MediaPickerProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  fileCount: number;
  disabled: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function MediaPicker({ inputRef, fileCount, disabled, onChange }: MediaPickerProps) {
  const pickerDisabled = disabled || fileCount >= MAX_POST_FILES;

  function openFilePicker() {
    inputRef.current?.click();
  }

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
        multiple
        disabled={pickerDisabled}
        className="hidden"
        onChange={onChange}
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pickerDisabled}
        onClick={openFilePicker}
        className="text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-400"
      >
        <ImagePlus className="size-4" />
        Foto
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pickerDisabled}
        onClick={openFilePicker}
        className="text-zinc-400 hover:bg-violet-500/10 hover:text-violet-400"
      >
        <Video className="size-4" />
        Video
      </Button>
    </div>
  );
}
