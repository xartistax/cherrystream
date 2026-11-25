import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

export type EmailTokenPurpose = "password-reset" | "verify-email";

const TOKEN_TTL_MS: Record<EmailTokenPurpose, number> = {
  "password-reset": 60 * 60 * 1000,
  "verify-email": 24 * 60 * 60 * 1000,
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function identifierFor(purpose: EmailTokenPurpose, email: string): string {
  return `${purpose}:${email.toLowerCase()}`;
}

/**
 * Stores only the hash in the Auth.js VerificationToken table. Creating a new token
 * invalidates older ones of the same purpose, so only the latest link works.
 */
export async function createEmailToken(purpose: EmailTokenPurpose, email: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const identifier = identifierFor(purpose, email);

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({
      where: {
        identifier,
      },
    }),
    prisma.verificationToken.create({
      data: {
        identifier,
        token: hashToken(token),
        expires: new Date(Date.now() + TOKEN_TTL_MS[purpose]),
      },
    }),
  ]);

  return token;
}

/** Returns the email the token was issued for and deletes the token, or null if it is unknown or expired. */
export async function consumeEmailToken(purpose: EmailTokenPurpose, token: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) {
    return null;
  }

  const record = await prisma.verificationToken.findFirst({
    where: {
      token: hashToken(token),
      identifier: {
        startsWith: `${purpose}:`,
      },
    },
  });

  if (!record) {
    return null;
  }

  await prisma.verificationToken.deleteMany({
    where: {
      identifier: record.identifier,
    },
  });

  if (record.expires < new Date()) {
    return null;
  }

  return record.identifier.slice(purpose.length + 1);
}

/** Like consumeEmailToken, but only checks validity, so a form can be shown before the token is used. */
export async function peekEmailToken(purpose: EmailTokenPurpose, token: string): Promise<boolean> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) {
    return false;
  }

  const record = await prisma.verificationToken.findFirst({
    where: {
      token: hashToken(token),
      identifier: {
        startsWith: `${purpose}:`,
      },
      expires: {
        gt: new Date(),
      },
    },
    select: {
      identifier: true,
    },
  });

  return Boolean(record);
}
