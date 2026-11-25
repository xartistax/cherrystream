// No "server-only" import: lib/auth.ts (also loaded by proxy.ts) uses this module.
import { createHmac } from "node:crypto";

import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function getClientIp(requestHeaders: Headers): string {
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();

  return forwarded || requestHeaders.get("x-real-ip") || "unknown";
}

/** Keyed hash so neither rate-limit keys nor reports store raw IP addresses. */
export function hashIdentifier(value: string): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET fehlt.");
  }

  return createHmac("sha256", secret).update(`identifier:${value}`).digest("hex").slice(0, 32);
}

export async function getRequestIpHash(): Promise<string> {
  return hashIdentifier(getClientIp(await headers()));
}

/**
 * Fixed-window counter in one atomic upsert. Fails open: a broken limiter must not lock everyone out,
 * and if the database is down the protected action fails anyway.
 */
export async function consumeRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  try {
    const [row] = await prisma.$queryRaw<Array<{ count: number; windowStart: Date }>>`
      INSERT INTO "RateLimit" ("key", "count", "windowStart")
      VALUES (${key}, 1, now())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimit"."windowStart" < now() - ${windowSeconds} * interval '1 second' THEN 1
          ELSE "RateLimit"."count" + 1
        END,
        "windowStart" = CASE
          WHEN "RateLimit"."windowStart" < now() - ${windowSeconds} * interval '1 second' THEN now()
          ELSE "RateLimit"."windowStart"
        END
      RETURNING "count", "windowStart"
    `;

    if (!row) {
      return {
        allowed: true,
        retryAfterSeconds: 0,
      };
    }

    const windowEndsAt = row.windowStart.getTime() + windowSeconds * 1000;

    return {
      allowed: row.count <= limit,
      retryAfterSeconds: Math.max(0, Math.ceil((windowEndsAt - Date.now()) / 1000)),
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }
}

export function formatRetryAfter(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);

  return minutes <= 1 ? "in einer Minute" : `in ${minutes} Minuten`;
}
