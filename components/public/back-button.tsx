"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button type="button" variant="ghost" onClick={() => router.back()} className="text-zinc-300 hover:bg-white/5 hover:text-white">
      <ArrowLeft className="size-4" />
      Zurück
    </Button>
  );
}
