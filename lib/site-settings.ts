// No "server-only" import: the proxy reads this file and does not run with the react-server condition.
import { randomBytes, timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/prisma";

const COMING_SOON_KEY = "comingSoon";

/** How long the proxy may use a cached value; a switch in the admin area reaches every server within this time. */
const CACHE_TTL_MS = 15_000;

export const PREVIEW_COOKIE = "cs_preview";

export type ComingSoonSetting = {
  enabled: boolean;
  /** Secret of the preview link; whoever opens /preview?key=… gets a cookie and sees the site. */
  previewKey: string;
};

let cache: { value: ComingSoonSetting; expiresAt: number } | null = null;

function parse(value: unknown): ComingSoonSetting | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const { enabled, previewKey } = value as Record<string, unknown>;

  return typeof enabled === "boolean" && typeof previewKey === "string" ? { enabled, previewKey } : null;
}

export function createPreviewKey(): string {
  return randomBytes(18).toString("base64url");
}

export async function getComingSoonSetting({ fresh = false } = {}): Promise<ComingSoonSetting> {
  if (!fresh && cache && cache.expiresAt > Date.now()) {
    return cache.value;
  }

  const row = await prisma.siteSetting.findUnique({
    where: {
      key: COMING_SOON_KEY,
    },
    select: {
      value: true,
    },
  });

  // Off until an admin switches it on; the preview key is created on first use.
  const value = parse(row?.value) ?? { enabled: false, previewKey: "" };

  cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };

  return value;
}

export async function saveComingSoonSetting(value: ComingSoonSetting, actorId: string): Promise<void> {
  await prisma.siteSetting.upsert({
    where: {
      key: COMING_SOON_KEY,
    },
    create: {
      key: COMING_SOON_KEY,
      value,
      updatedById: actorId,
    },
    update: {
      value,
      updatedById: actorId,
    },
  });

  cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
}

export function isValidPreviewKey(candidate: string | undefined, previewKey: string): boolean {
  if (!candidate || !previewKey) {
    return false;
  }

  const expected = Buffer.from(previewKey);
  const received = Buffer.from(candidate);

  return expected.length === received.length && timingSafeEqual(expected, received);
}
