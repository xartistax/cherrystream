"use server";

import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, formatRetryAfter, getRequestIpHash } from "@/lib/rate-limit";
import { reportReasons } from "@/lib/reports/reasons";

export type SubmitReportResult = {
  success: boolean;
  message?: string;
};

const reportSchema = z.object({
  username: z.string().min(1),
  postId: z.string().min(1).optional(),
  reason: z.enum(reportReasons.map((reason) => reason.value) as [string, ...string[]]),
  details: z
    .string()
    .trim()
    .max(1_000)
    .optional()
    .transform((value) => value || null),
});

/** Anyone can report, also without an account; rate limited per IP. */
export async function submitReportAction(input: unknown): Promise<SubmitReportResult> {
  const parsed = reportSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "Bitte wähle einen Grund aus.",
    };
  }

  const reporterHash = await getRequestIpHash();
  const limit = await consumeRateLimit(`report:${reporterHash}`, 10, 60 * 60);

  if (!limit.allowed) {
    return {
      success: false,
      message: `Du hast sehr viele Meldungen gesendet. Bitte versuche es ${formatRetryAfter(limit.retryAfterSeconds)} erneut.`,
    };
  }

  const { username, postId, reason, details } = parsed.data;

  const reportedUser = await prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
    },
  });

  if (!reportedUser) {
    return {
      success: false,
      message: "Das Profil wurde nicht gefunden.",
    };
  }

  if (postId) {
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        authorId: reportedUser.id,
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      return {
        success: false,
        message: "Der Beitrag wurde nicht gefunden.",
      };
    }
  }

  const session = await auth();

  await prisma.report.create({
    data: {
      reportedUserId: reportedUser.id,
      postId: postId ?? null,
      reason: reason as (typeof reportReasons)[number]["value"],
      details,
      reporterId: session?.user?.impersonatedBy ? null : (session?.user?.id ?? null),
      reporterHash,
    },
  });

  return {
    success: true,
  };
}
