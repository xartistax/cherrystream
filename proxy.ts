import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

/**
 * Optimistic check only: redirects signed-out visitors to the login.
 * Role and status checks stay in the pages and actions (lib/access.ts).
 */
export const proxy = auth((request) => {
  if (request.auth?.user) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.nextUrl.origin);
  loginUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/credits/:path*",
    "/favorites",
    "/notifications",
    "/profile",
    "/profile/edit",
    "/become-model/:path*",
  ],
};
