import { timingSafeEqual } from "node:crypto";

import { runCleanup } from "@/lib/cleanup";

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

/** Called daily by Vercel Cron (vercel.json), which sends "Authorization: Bearer <CRON_SECRET>". */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new Response(null, { status: 401 });
  }

  const result = await runCleanup();

  console.info("Cleanup finished", result);

  return Response.json(result, {
    status: result.verificationDocumentsPurged ? 200 : 500,
  });
}
