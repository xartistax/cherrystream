import "server-only";

import { applyDueAutoBumps } from "@/lib/boosts/apply-auto-bumps";
import { ECONOMY } from "@/lib/economy";
import { prisma } from "@/lib/prisma";

export type BoostStatus = {
  credits: number;
  bumpedAt: Date | null;
  /** Position in the default listing among all public models, 1 = top. Null while the profile is not listed. */
  position: number | null;
  nextBumpAt: Date | null;
  highlightUntil: Date | null;
  autoBumpUntil: Date | null;
  autoBumpIntervalMinutes: number | null;
  history: Array<{
    id: string;
    option: string;
    credits: number;
    startsAt: Date;
    endsAt: Date;
    createdAt: Date;
  }>;
};

export async function getBoostStatus(userId: string): Promise<BoostStatus> {
  await applyDueAutoBumps();

  const now = new Date();

  const [wallet, user, lastBump, autoBumps, history] = await Promise.all([
    prisma.wallet.findUnique({
      where: {
        userId,
      },
      select: {
        userCredits: true,
      },
    }),
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        modelStatus: true,
        status: true,
        profile: {
          select: {
            isPublic: true,
            bumpedAt: true,
            highlightUntil: true,
          },
        },
      },
    }),
    prisma.boost.findFirst({
      where: {
        userId,
        type: "BUMP",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    }),
    prisma.boost.findMany({
      where: {
        userId,
        type: "AUTO_BUMP",
        endsAt: {
          gt: now,
        },
      },
      orderBy: {
        startsAt: "asc",
      },
      select: {
        startsAt: true,
        endsAt: true,
        intervalMinutes: true,
      },
    }),
    prisma.boost.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        option: true,
        credits: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
      },
    }),
  ]);

  const profile = user?.profile;
  const listed = user?.status === "ACTIVE" && user.modelStatus === "ACTIVE" && profile?.isPublic === true && profile.bumpedAt !== null;

  const position =
    listed && profile.bumpedAt
      ? (await prisma.profile.count({
          where: {
            isPublic: true,
            bumpedAt: {
              gt: profile.bumpedAt,
            },
            user: {
              status: "ACTIVE",
              role: "MODEL",
              modelStatus: "ACTIVE",
            },
          },
        })) + 1
      : null;

  const nextBumpAt = lastBump ? new Date(lastBump.createdAt.getTime() + ECONOMY.bumpCooldownMinutes * 60 * 1000) : null;
  const runningAutoBump = autoBumps.find((boost) => boost.startsAt <= now) ?? null;

  return {
    credits: wallet?.userCredits ?? 0,
    bumpedAt: profile?.bumpedAt ?? null,
    position,
    nextBumpAt: nextBumpAt && nextBumpAt > now ? nextBumpAt : null,
    highlightUntil: profile?.highlightUntil && profile.highlightUntil > now ? profile.highlightUntil : null,
    autoBumpUntil: autoBumps.at(-1)?.endsAt ?? null,
    autoBumpIntervalMinutes: runningAutoBump?.intervalMinutes ?? null,
    history,
  };
}
