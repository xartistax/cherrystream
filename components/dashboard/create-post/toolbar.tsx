"use client";

import { LoaderCircle, Send } from "lucide-react";
import type { ChangeEvent, RefObject } from "react";

import { MediaPicker } from "@/components/dashboard/create-post/media-picker";
import { Button } from "@/components/ui/button";

type ToolbarProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  fileCount: number;
  disabled: boolean;
  canSubmit: boolean;
  isSubmitting: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
};

export function Toolbar({ inputRef, fileCount, disabled, canSubmit, isSubmitting, onFileChange, onSubmit }: ToolbarProps) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
      <MediaPicker inputRef={inputRef} fileCount={fileCount} disabled={disabled} onChange={onFileChange} />

      <Button type="button" disabled={!canSubmit} onClick={onSubmit} className="bg-rose-600 text-white hover:bg-rose-500">
        {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
        Posten
      </Button>
    </div>
  );
}
