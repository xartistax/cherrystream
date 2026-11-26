"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { IN_APP_NAVIGATION_KEY } from "@/components/public/navigation-tracker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  /** Where to go when there is no page of this site to go back to, e.g. a profile opened from a shared link. */
  fallbackHref?: string;
  label?: string;
  /** Icon only, for tight spaces like the sticky profile bar. */
  compact?: boolean;
  className?: string;
};

export function BackButton({ fallbackHref = "/", label = "Zurück", compact = false, className }: BackButtonProps) {
  const router = useRouter();

  function handleClick() {
    let navigatedInApp = false;

    try {
      navigatedInApp = sessionStorage.getItem(IN_APP_NAVIGATION_KEY) === "1";
    } catch {
      navigatedInApp = false;
    }

    const cameFromThisSite = navigatedInApp || (document.referrer !== "" && new URL(document.referrer).origin === window.location.origin);

    if (cameFromThisSite && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon" : "default"}
      onClick={handleClick}
      aria-label={label}
      className={cn("shrink-0 text-zinc-300 hover:bg-white/5 hover:text-white", className)}
    >
      <ArrowLeft className="size-4" />
      {compact ? null : label}
    </Button>
  );
}
