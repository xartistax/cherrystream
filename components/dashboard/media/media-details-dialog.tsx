"use client";

import { CalendarDays, Copy, Download, ExternalLink, FileImage, HardDrive, Play, Ruler, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { StudioMediaCardData } from "@/components/dashboard/media/media-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type MediaDetailsDialogProps = {
  media: StudioMediaCardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(duration: number | null) {
  if (!duration) return null;

  const total = Math.round(duration);
  const min = Math.floor(total / 60);
  const sec = total % 60;

  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("de-CH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function MediaDetailsDialog({ media, open, onOpenChange }: MediaDetailsDialogProps) {
  if (!media) return null;

  const preview = media.type === "VIDEO" ? (media.posterUrl ?? media.feedUrl ?? media.url) : (media.feedUrl ?? media.url);

  const duration = formatDuration(media.duration);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl overflow-hidden border-white/10 bg-zinc-950 p-0 text-white">
        <div className="grid md:grid-cols-[1fr_360px]">
          <div className="relative flex min-h-[650px] items-center justify-center bg-black">
            {media.type === "VIDEO" ? (
              <video src={media.fullUrl ?? media.url} poster={preview} controls className="max-h-[650px] w-full object-contain" />
            ) : (
              <Image src={preview} alt="" fill sizes="70vw" className="object-contain" />
            )}
          </div>

          <div className="flex flex-col">
            <DialogHeader className="border-b border-white/10 p-6">
              <DialogTitle className="flex items-center gap-3">
                {media.type === "VIDEO" ? <Video className="size-5 text-sky-400" /> : <FileImage className="size-5 text-violet-400" />}
                Mediendetails
              </DialogTitle>

              <DialogDescription className="text-zinc-500">Informationen zu dieser Datei.</DialogDescription>
            </DialogHeader>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Beitrag</h3>

                <Link
                  href={`/dashboard/posts/${media.post.id}`}
                  className="block rounded-xl border border-white/10 bg-white/3 p-4 transition hover:border-rose-500/30 hover:bg-white/[0.05]"
                >
                  <p className="line-clamp-2 font-medium text-white">{media.post.content || "Ohne Beschreibung"}</p>

                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-rose-400">
                    Beitrag öffnen
                    <ExternalLink className="size-4" />
                  </p>
                </Link>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Datei</h3>

                <div className="space-y-3">
                  <InfoRow icon={<HardDrive className="size-4" />} label="Größe" value={formatBytes(media.size)} />

                  <InfoRow
                    icon={<Ruler className="size-4" />}
                    label="Auflösung"
                    value={media.width && media.height ? `${media.width} × ${media.height}` : "—"}
                  />

                  <InfoRow icon={<CalendarDays className="size-4" />} label="Erstellt" value={formatDate(media.createdAt)} />

                  <InfoRow
                    icon={media.type === "VIDEO" ? <Play className="size-4" /> : <FileImage className="size-4" />}
                    label="Typ"
                    value={media.type === "VIDEO" ? "Video" : "Bild"}
                  />

                  {duration ? <InfoRow icon={<Play className="size-4" />} label="Dauer" value={duration} /> : null}

                  <InfoRow icon={<Copy className="size-4" />} label="Format" value={media.mimeType} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Status</h3>

                <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">Bereit</Badge>
              </section>
            </div>

            <div className="border-t border-white/10 p-6">
              <a
                href={media.fullUrl ?? media.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <Download className="size-4" />
                Original öffnen
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type InfoRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/3 px-4 py-3">
      <div className="flex items-center gap-3 text-zinc-400">
        {icon}

        <span>{label}</span>
      </div>

      <span className="max-w-[170px] truncate text-right font-medium text-white">{value}</span>
    </div>
  );
}
