"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export const IN_APP_NAVIGATION_KEY = "cherrystream:navigated";

/**
 * Remembers per browser tab that the visitor moved between pages of this site, so a back button knows that
 * going back stays on CherryStream. document.referrer cannot tell, it keeps the value of the first page load.
 */
export function NavigationTracker() {
  const pathname = usePathname();
  const firstPathname = useRef(pathname);

  useEffect(() => {
    if (pathname === firstPathname.current) {
      return;
    }

    try {
      sessionStorage.setItem(IN_APP_NAVIGATION_KEY, "1");
    } catch {
      // Without storage the back button falls back to its link, which is fine.
    }
  }, [pathname]);

  return null;
}
