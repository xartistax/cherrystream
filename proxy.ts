import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getComingSoonSetting, isValidPreviewKey, PREVIEW_COOKIE } from "@/lib/site-settings";

/** Pages that need an account; role and status checks stay in the pages and actions (lib/access.ts). */
const SIGNED_IN_PATHS = [/^\/dashboard(\/|$)/, /^\/admin(\/|$)/, /^\/settings(\/|$)/, /^\/credits(\/|$)/, /^\/favorites$/, /^\/notifications$/, /^\/profile$/, /^\/profile\/edit$/, /^\/become-model(\/|$)/];

/** Reachable for everyone while the site is in coming-soon mode: sign-in, invites, legal pages and technical routes. */
const COMING_SOON_OPEN_PATHS = [
  /^\/coming-soon$/,
  /^\/preview$/,
  /^\/login$/,
  /^\/forgot-password$/,
  /^\/reset-password\//,
  /^\/verify-email\//,
  /^\/claim\//,
  /^\/imprint$/,
  /^\/privacy$/,
  /^\/terms$/,
  /^\/api\//,
  /^\/sentry-tunnel/,
];

export const proxy = auth(async (request) => {
  const { pathname, searchParams } = request.nextUrl;
  const signedIn = Boolean(request.auth?.user);

  if (!signedIn && SIGNED_IN_PATHS.some((pattern) => pattern.test(pathname))) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);

    return NextResponse.redirect(loginUrl);
  }

  if (signedIn || COMING_SOON_OPEN_PATHS.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }

  let comingSoon;

  try {
    comingSoon = await getComingSoonSetting();
  } catch (error) {
    // If the setting cannot be read, the site stays open rather than locking everyone out.
    console.error("Coming-soon setting unavailable:", error);
    return NextResponse.next();
  }

  if (!comingSoon.enabled || isValidPreviewKey(request.cookies.get(PREVIEW_COOKIE)?.value, comingSoon.previewKey)) {
    return NextResponse.next();
  }

  // Registration only for invited models; random visitors would otherwise sign up past the gate.
  if (pathname === "/register" && searchParams.get("callbackUrl")?.startsWith("/claim/")) {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL("/coming-soon", request.nextUrl.origin));
});

export const config = {
  // Every page, but no static files, images or Next.js internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
