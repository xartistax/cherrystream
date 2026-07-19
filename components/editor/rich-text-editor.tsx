"use client";

import { CharacterCount } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Italic, List, ListOrdered, Quote, Redo2, Strikethrough, Undo2 } from "lucide-react";
import { useState } from "react";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_CHARACTERS = 5_000;

type ProfileDescriptionEditorProps = {
  initialValue: string;
  error?: string[];
};

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({ label, active = false, disabled = false, onClick, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn("size-9 text-zinc-400 hover:bg-white/10 hover:text-white", active && "bg-rose-500/15 text-rose-300")}
    >
      {children}
    </Button>
  );
}

export function ProfileDescriptionEditor({ initialValue, error }: ProfileDescriptionEditorProps) {
  const [html, setHtml] = useState(initialValue);
  const [characterCount, setCharacterCount] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      CharacterCount.configure({
        limit: MAX_CHARACTERS,
      }),
      Placeholder.configure({
        placeholder: "Erzähle etwas über dich, deine Inhalte und was Besucher erwarten können …",
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https"],
      }),
    ],
    content: initialValue,
    onCreate: ({ editor }) => {
      const value = editor.isEmpty ? "" : editor.getHTML();

      setHtml(value);
      setCharacterCount(editor.storage.characterCount.characters());
    },

    onUpdate: ({ editor }) => {
      const value = editor.isEmpty ? "" : editor.getHTML();

      setHtml(value);
      setCharacterCount(editor.storage.characterCount.characters());
    },
    editorProps: {
      attributes: {
        class: "min-h-72 px-4 py-4 text-sm leading-7 text-zinc-200 outline-none",
      },
    },
  });

  return (
    <div className="space-y-2">
      <input type="hidden" name="bio" value={html} />

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60 focus-within:border-rose-500/40 focus-within:ring-2 focus-within:ring-rose-500/10">
        <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-white/[0.03] p-2">
          <ToolbarButton
            label="Überschrift"
            active={editor?.isActive("heading", { level: 2 })}
            disabled={!editor}
            onClick={() => {
              editor?.chain().focus().toggleHeading({ level: 2 }).run();
            }}
          >
            <Heading2 className="size-4" />
          </ToolbarButton>

          <ToolbarButton
            label="Fett"
            active={editor?.isActive("bold")}
            disabled={!editor}
            onClick={() => {
              editor?.chain().focus().toggleBold().run();
            }}
          >
            <Bold className="size-4" />
          </ToolbarButton>

          <ToolbarButton
            label="Kursiv"
            active={editor?.isActive("italic")}
            disabled={!editor}
            onClick={() => {
              editor?.chain().focus().toggleItalic().run();
            }}
          >
            <Italic className="size-4" />
          </ToolbarButton>

          <ToolbarButton
            label="Durchgestrichen"
            active={editor?.isActive("strike")}
            disabled={!editor}
            onClick={() => {
              editor?.chain().focus().toggleStrike().run();
            }}
          >
            <Strikethrough className="size-4" />
          </ToolbarButton>

          <div className="mx-1 h-6 w-px bg-white/10" />

          <ToolbarButton
            label="Aufzählung"
            active={editor?.isActive("bulletList")}
            disabled={!editor}
            onClick={() => {
              editor?.chain().focus().toggleBulletList().run();
            }}
          >
            <List className="size-4" />
          </ToolbarButton>

          <ToolbarButton
            label="Nummerierte Liste"
            active={editor?.isActive("orderedList")}
            disabled={!editor}
            onClick={() => {
              editor?.chain().focus().toggleOrderedList().run();
            }}
          >
            <ListOrdered className="size-4" />
          </ToolbarButton>

          <ToolbarButton
            label="Zitat"
            active={editor?.isActive("blockquote")}
            disabled={!editor}
            onClick={() => {
              editor?.chain().focus().toggleBlockquote().run();
            }}
          >
            <Quote className="size-4" />
          </ToolbarButton>

          <div className="mx-1 h-6 w-px bg-white/10" />

          <ToolbarButton
            label="Rückgängig"
            disabled={!editor?.can().chain().focus().undo().run()}
            onClick={() => {
              editor?.chain().focus().undo().run();
            }}
          >
            <Undo2 className="size-4" />
          </ToolbarButton>

          <ToolbarButton
            label="Wiederholen"
            disabled={!editor?.can().chain().focus().redo().run()}
            onClick={() => {
              editor?.chain().focus().redo().run();
            }}
          >
            <Redo2 className="size-4" />
          </ToolbarButton>
        </div>

        <EditorContent
          editor={editor}
          className={cn(
            "[&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:text-white",
            "[&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:mt-5 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:text-white",
            "[&_.ProseMirror_p]:my-3",
            "[&_.ProseMirror_ul]:my-4 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6",
            "[&_.ProseMirror_ol]:my-4 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6",
            "[&_.ProseMirror_blockquote]:my-4 [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-rose-500/50 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-zinc-400",
          )}
        />

        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
          <p className="text-xs text-zinc-600">Überschriften, Listen und Hervorhebungen sind erlaubt.</p>

          <span className={cn("text-xs tabular-nums text-zinc-500", characterCount > MAX_CHARACTERS * 0.9 && "text-amber-400")}>
            {characterCount.toLocaleString("de-CH")} / {MAX_CHARACTERS.toLocaleString("de-CH")}
          </span>
        </div>
      </div>

      {error?.length ? <p className="text-sm text-rose-400">{error[0]}</p> : null}
    </div>
  );
}
