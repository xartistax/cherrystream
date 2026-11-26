"use client";

import { Cherry } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const COOKIE_NAME = "cs_age_confirmed";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Legal pages stay readable without confirming, so visitors can check imprint and terms first. */
const EXEMPT_PATHS = new Set(["/imprint", "/privacy", "/terms"]);

function hasConfirmedCookie(): boolean {
  return document.cookie.split("; ").includes(`${COOKIE_NAME}=1`);
}

function subscribe(): () => void {
  return () => {};
}

/**
 * Rendered on the server for everyone, so public pages stay static. The inline script hides it before the first paint
 * for visitors who already confirmed; React then unmounts it after hydration.
 */
export function AgeGate() {
  const pathname = usePathname();
  // Server snapshot is "not confirmed"; in the browser the cookie decides.
  const hasCookie = useSyncExternalStore(subscribe, hasConfirmedCookie, () => false);
  const [confirmedNow, setConfirmedNow] = useState(false);

  if (hasCookie || confirmedNow || EXEMPT_PATHS.has(pathname)) {
    return null;
  }

  function confirm() {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";

    document.cookie = `${COOKIE_NAME}=1; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
    setConfirmedNow(true);
  }

  return (
    <>
      <div
        suppressHydrationWarning
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/95 p-4 backdrop-blur-xl"
      >
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-8 text-center text-white shadow-2xl">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
            <Cherry className="size-7" />
          </div>

          <h2 id="age-gate-title" className="mt-6 text-2xl font-black tracking-tight">
            Nur für Erwachsene
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            CherryStream zeigt Erotik- und Escort-Inserate mit freizügigen Fotos. Bestätige, dass du mindestens 18 Jahre alt bist und solche
            Inhalte sehen möchtest.
          </p>

          <div className="mt-8 grid gap-3">
            <Button type="button" onClick={confirm} className="h-11 bg-rose-600 text-white hover:bg-rose-500">
              Ich bin 18 oder älter
            </Button>

            <a
              href="https://www.google.ch"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm text-zinc-300 transition hover:bg-white/10"
            >
              Verlassen
            </a>
          </div>

          <p className="mt-6 text-xs text-zinc-600">
            <Link href="/terms" className="hover:text-zinc-400">
              Nutzungsbedingungen
            </Link>{" "}
            ·{" "}
            <Link href="/privacy" className="hover:text-zinc-400">
              Datenschutz
            </Link>{" "}
            ·{" "}
            <Link href="/imprint" className="hover:text-zinc-400">
              Impressum
            </Link>
          </p>
        </div>
      </div>

      <script
        // Runs while the HTML is parsed, before paint: hides the gate for returning visitors without a flash.
        dangerouslySetInnerHTML={{
          __html: `(function(){try{if(document.cookie.split("; ").indexOf("${COOKIE_NAME}=1")!==-1){var s=document.currentScript;if(s&&s.previousElementSibling){s.previousElementSibling.style.display="none";}}}catch(e){}})();`,
        }}
      />
    </>
  );
}
