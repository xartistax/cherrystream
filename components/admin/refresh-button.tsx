"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
    >
      {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      Neu prüfen
    </Button>
  );
}
