"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

/** Last-resort boundary when the root layout itself fails; reports to Sentry if configured. */
export default function GlobalError({ error, unstable_retry }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="de">
      <body className="flex min-h-svh items-center justify-center bg-zinc-950 p-4 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-black">Etwas ist schiefgelaufen</h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
            {error.digest ? <span className="mt-2 block font-mono text-xs text-zinc-600">Fehler-ID: {error.digest}</span> : null}
          </p>

          <button
            type="button"
            onClick={() => unstable_retry()}
            className="mt-6 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500"
          >
            Erneut versuchen
          </button>
        </div>
      </body>
    </html>
  );
}
