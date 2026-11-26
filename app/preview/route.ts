import { NextResponse } from "next/server";

import { getComingSoonSetting, isValidPreviewKey, PREVIEW_COOKIE } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

const PREVIEW_COOKIE_DAYS = 30;

/** Opens the site for people with the preview link while it is in coming-soon mode (link under Admin → Website). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? undefined;
  const setting = await getComingSoonSetting({ fresh: true });

  if (!isValidPreviewKey(key, setting.previewKey)) {
    return NextResponse.redirect(new URL("/coming-soon", url.origin));
  }

  const response = NextResponse.redirect(new URL("/", url.origin));

  response.cookies.set(PREVIEW_COOKIE, setting.previewKey, {
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: PREVIEW_COOKIE_DAYS * 24 * 60 * 60,
  });

  return response;
}
