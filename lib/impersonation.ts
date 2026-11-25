import { createHmac, timingSafeEqual } from "node:crypto";

import type { UserRole } from "@/generated/prisma/enums";

/** An impersonation session ends automatically after this time. */
export const IMPERSONATION_MAX_AGE_MS = 60 * 60 * 1000;

/** A grant must be redeemed right away by the session update that follows the admin action. */
const GRANT_MAX_AGE_MS = 60 * 1000;

export function getHomePath(role: UserRole): string {
  if (role === "ADMIN") {
    return "/admin";
  }

  return role === "MODEL" ? "/dashboard" : "/explore";
}

function sign(payload: string): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET fehlt.");
  }

  return createHmac("sha256", secret).update(`impersonation:${payload}`).digest("base64url");
}

/**
 * Issued only by the admin server action (which also writes the audit log). The JWT callback refuses
 * impersonation requests without a valid grant, so a raw POST to /api/auth/session cannot start one.
 */
export function createImpersonationGrant(adminId: string, targetUserId: string): string {
  const payload = `${adminId}.${targetUserId}.${Date.now()}`;

  return `${payload}.${sign(payload)}`;
}

export function verifyImpersonationGrant(grant: unknown, adminId: string): string | null {
  if (typeof grant !== "string") {
    return null;
  }

  const parts = grant.split(".");

  if (parts.length !== 4) {
    return null;
  }

  const [grantAdminId, targetUserId, issuedAt, signature] = parts;
  const expected = Buffer.from(sign(`${grantAdminId}.${targetUserId}.${issuedAt}`));
  const received = Buffer.from(signature);

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  if (grantAdminId !== adminId || Date.now() - Number(issuedAt) > GRANT_MAX_AGE_MS) {
    return null;
  }

  return targetUserId;
}
