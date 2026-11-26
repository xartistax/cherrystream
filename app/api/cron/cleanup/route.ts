import { timingSafeEqual } from "node:crypto";

import { runDailyAlerts } from "@/lib/admin-alerts/daily";
import { runCleanup, type CleanupResult } from "@/lib/cleanup";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");

  if (!secret || !header) {
    return false;
  }

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);

  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * Called daily by Vercel Cron (vercel.json), which sends "Authorization: Bearer <CRON_SECRET>".
 * Cleans up first, then sends the daily Telegram messages (problems, waiting verifications, summary).
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new Response(null, { status: 401 });
  }

  let result: CleanupResult | null = null;
  let cleanupError: unknown = null;

  try {
    result = await runCleanup();
    console.info("Cleanup finished", result);
  } catch (error) {
    cleanupError = error;
    console.error("Cleanup failed:", error);
  }

  try {
    await runDailyAlerts(result, cleanupError);
  } catch (error) {
    console.error("Daily alerts failed:", error);
  }

  return Response.json(result ?? { error: "Cleanup failed" }, {
    status: result?.verificationDocumentsPurged ? 200 : 500,
  });
}
