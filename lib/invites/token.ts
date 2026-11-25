import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";

export const INVITE_VALIDITY_DAYS = 30;

export function getInviteExpiry(from = new Date()): Date {
  return new Date(from.getTime() + INVITE_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
}

/** The plain token only exists in the link; the database stores its hash. */
export function createInviteToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");

  return {
    token,
    tokenHash: hashInviteToken(token),
  };
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getInviteUrl(token: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return new URL(`/claim/${token}`, appUrl).toString();
}

/**
 * Normalises Swiss and international numbers to +<digits>. Returns null for anything that is not a plausible phone number.
 */
export function normalizePhoneNumber(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  let digits = value.replace(/[^\d+]/g, "");

  if (digits.startsWith("00")) {
    digits = `+${digits.slice(2)}`;
  } else if (digits.startsWith("0")) {
    digits = `+41${digits.slice(1)}`;
  }

  return /^\+\d{8,15}$/.test(digits) ? digits : null;
}

/**
 * Keyed hash of a phone number. A plain SHA-256 could be reversed by trying all numbers,
 * the secret prevents that. Hashes are only comparable within the same environment (same AUTH_SECRET).
 */
export function hashContact(phoneNumber: string): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET fehlt.");
  }

  return createHmac("sha256", secret).update(`declined-contact:${phoneNumber}`).digest("hex");
}
