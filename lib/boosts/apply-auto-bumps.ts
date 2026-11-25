import "server-only";

import { prisma } from "@/lib/prisma";

const MIN_INTERVAL_MS = 60 * 1000;

let lastRunAt = 0;

/**
 * Moves Profile.bumpedAt to the latest due slot of every running auto bump.
 *
 * Vercel Hobby runs cron jobs only once a day, so listings call this before they sort instead.
 * Slots are startsAt + k × interval up to now (and before endsAt); a profile only ever moves forward.
 * Runs at most once a minute per server instance.
 */
export async function applyDueAutoBumps(): Promise<void> {
  const now = Date.now();

  if (now - lastRunAt < MIN_INTERVAL_MS) {
    return;
  }

  lastRunAt = now;

  try {
    await runAutoBumps();
  } catch (error) {
    // Sorting must not fail because of a late auto bump; the next run catches up.
    lastRunAt = 0;
    console.error("Applying auto bumps failed:", error);
  }
}

/** The update itself, without throttling. Returns the number of profiles moved up. */
export async function runAutoBumps(): Promise<number> {
  // Prisma stores timestamps without time zone in UTC, so "now" is taken in UTC as well.
  return prisma.$executeRaw`
      WITH clock AS (SELECT (now() AT TIME ZONE 'UTC') AS now)
      UPDATE "Profile" AS p
      SET "bumpedAt" = due.slot
      FROM (
        SELECT
          b."userId",
          MAX(
            b."startsAt" + make_interval(mins => b."intervalMinutes") * floor(
              extract(epoch FROM (LEAST(clock.now, b."endsAt" - interval '1 second') - b."startsAt")) / (b."intervalMinutes" * 60)
            )
          ) AS slot
        FROM "Boost" AS b, clock
        WHERE b."type" = 'AUTO_BUMP'::"BoostType"
          AND b."startsAt" <= clock.now
          AND b."endsAt" > clock.now - interval '1 day'
        GROUP BY b."userId"
      ) AS due
      WHERE p."userId" = due."userId"
        AND (p."bumpedAt" IS NULL OR p."bumpedAt" < due.slot)
  `;
}
