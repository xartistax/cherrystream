"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import type { Session } from "next-auth";

import { getAdminAccess } from "@/lib/access";
import { logAdminAction } from "@/lib/admin/audit";
import { auth, unstable_update } from "@/lib/auth";
import { createImpersonationGrant } from "@/lib/impersonation";
import { prisma } from "@/lib/prisma";

/** unstable_update is typed for session fields only; the jwt callback reads `impersonation` from the update payload. */
function updateImpersonation(impersonation: { grant: string } | null) {
  return unstable_update({ impersonation } as unknown as Partial<Session>);
}

export async function startImpersonationAction(formData: FormData): Promise<void> {
  const access = await getAdminAccess();

  if (!access.allowed) {
    throw new Error(access.message);
  }

  const targetUserId = z.string().min(1).parse(formData.get("userId"));

  const target = await prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
    select: {
      username: true,
      role: true,
      status: true,
    },
  });

  if (!target || target.role !== "MODEL" || target.status !== "ACTIVE") {
    throw new Error("Nur aktive Model-Konten können angesehen werden.");
  }

  await prisma.$transaction((transaction) =>
    logAdminAction(transaction, {
      actorId: access.userId,
      action: "IMPERSONATION_STARTED",
      targetType: "User",
      targetId: targetUserId,
      metadata: {
        username: target.username,
      },
    }),
  );

  await updateImpersonation({
    grant: createImpersonationGrant(access.userId, targetUserId),
  });

  redirect("/dashboard");
}

export async function stopImpersonationAction(): Promise<void> {
  const session = await auth();
  const impersonatedBy = session?.user?.impersonatedBy;

  if (session?.user && impersonatedBy) {
    await prisma.$transaction((transaction) =>
      logAdminAction(transaction, {
        actorId: impersonatedBy.id,
        action: "IMPERSONATION_STOPPED",
        targetType: "User",
        targetId: session.user.id,
        metadata: {
          username: session.user.username,
        },
      }),
    );
  }

  // Clearing is always safe, so it does not require the admin check.
  await updateImpersonation(null);

  redirect("/admin/users");
}
