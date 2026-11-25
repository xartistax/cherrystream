import "server-only";

import { createHmac } from "node:crypto";

// Without 0/O and 1/I/L so the code is unambiguous on a handwritten note.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

/**
 * Deterministic code the model holds up in the selfie. It changes with every attempt,
 * so an old selfie cannot be reused, and needs no database row before submission.
 */
export function getChallengeCode(userId: string, attempt: number): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET fehlt.");
  }

  const digest = createHmac("sha256", secret).update(`model-verification:${userId}:${attempt}`).digest();

  return Array.from(digest.subarray(0, CODE_LENGTH), (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}
