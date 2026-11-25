"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminAccess } from "@/lib/access";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";

const resolveSchema = z.object({
  reportId: z.string().min(1),
  decision: z.enum(["RESOLVED", "DISMISSED"]),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value || null),
});

/** Closes a report. The actual measure (hide post, suspend account) is a separate admin action. */
export async function closeReportAction(formData: FormData): Promise<void> {
  const access = await getAdminAccess();

  if (!access.allowed) {
    throw new Error(access.message);
  }

  const input = resolveSchema.parse({
    reportId: formData.get("reportId"),
    decision: formData.get("decision"),
    note: formData.get("note") ?? undefined,
  });

  await prisma.$transaction(async (transaction) => {
    const report = await transaction.report.findUnique({
      where: {
        id: input.reportId,
      },
      select: {
        status: true,
        reason: true,
        reportedUser: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!report || report.status !== "OPEN") {
      return;
    }

    await transaction.report.update({
      where: {
        id: input.reportId,
      },
      data: {
        status: input.decision,
        resolvedAt: new Date(),
        resolvedById: access.userId,
        resolutionNote: input.note,
      },
    });

    await logAdminAction(transaction, {
      actorId: access.userId,
      action: input.decision === "RESOLVED" ? "REPORT_RESOLVED" : "REPORT_DISMISSED",
      targetType: "Report",
      targetId: input.reportId,
      metadata: {
        username: report.reportedUser.username,
        reason: report.reason,
        ...(input.note ? { note: input.note } : {}),
      },
    });
  });

  revalidatePath("/admin/reports");
  revalidatePath("/admin");
}
