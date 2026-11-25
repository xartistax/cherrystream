import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { AdminAction } from "@/generated/prisma/enums";

type AuditEntry = {
  actorId: string;
  action: AdminAction;
  targetType: "ModelVerification" | "User" | "Post" | "ModelInvite";
  targetId: string;
  metadata?: Prisma.InputJsonValue;
};

/** Writes the audit entry inside the same transaction as the change it describes. */
export function logAdminAction(transaction: Prisma.TransactionClient, entry: AuditEntry) {
  return transaction.adminAuditLog.create({
    data: entry,
  });
}
