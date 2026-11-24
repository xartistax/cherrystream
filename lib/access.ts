import "server-only";

import { redirect } from "next/navigation";

import type { ModelStatus, UserRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CreatorAccessOptions = {
  requireActive?: boolean;
};

type CreatorAccessDenial = "UNAUTHENTICATED" | "NOT_CREATOR" | "NOT_ACTIVE";

export type CreatorAccess =
  | {
      allowed: true;
      userId: string;
      role: UserRole;
      modelStatus: ModelStatus;
    }
  | {
      allowed: false;
      reason: CreatorAccessDenial;
      message: string;
    };

const denialMessages: Record<CreatorAccessDenial, string> = {
  UNAUTHENTICATED: "Du bist nicht angemeldet.",
  NOT_CREATOR: "Diese Funktion ist nur für Models verfügbar.",
  NOT_ACTIVE: "Dein Model-Profil ist noch nicht freigeschaltet.",
};

function deny(reason: CreatorAccessDenial): CreatorAccess {
  return {
    allowed: false,
    reason,
    message: denialMessages[reason],
  };
}

/**
 * Creator = MODEL (not suspended) or ADMIN.
 * With `requireActive`, a MODEL must additionally be approved (modelStatus ACTIVE).
 * Role and status are read from the database, not the JWT, so approvals and suspensions apply immediately.
 */
export async function getCreatorAccess({ requireActive = false }: CreatorAccessOptions = {}): Promise<CreatorAccess> {
  const session = await auth();

  if (!session?.user?.id) {
    return deny("UNAUTHENTICATED");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
      status: true,
      modelStatus: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return deny("UNAUTHENTICATED");
  }

  if (user.role === "ADMIN") {
    return {
      allowed: true,
      userId: user.id,
      role: user.role,
      modelStatus: user.modelStatus,
    };
  }

  if (user.role !== "MODEL" || user.modelStatus === "SUSPENDED") {
    return deny("NOT_CREATOR");
  }

  if (requireActive && user.modelStatus !== "ACTIVE") {
    return deny("NOT_ACTIVE");
  }

  return {
    allowed: true,
    userId: user.id,
    role: user.role,
    modelStatus: user.modelStatus,
  };
}

const denialRedirects: Record<CreatorAccessDenial, string> = {
  UNAUTHENTICATED: "/login",
  NOT_CREATOR: "/become-model",
  NOT_ACTIVE: "/dashboard",
};

export async function requireCreatorPage(options: CreatorAccessOptions = {}) {
  const access = await getCreatorAccess(options);

  if (!access.allowed) {
    redirect(denialRedirects[access.reason]);
  }

  return access;
}
