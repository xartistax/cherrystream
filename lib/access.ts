import "server-only";

import { notFound, redirect } from "next/navigation";

import type { ModelStatus, UserRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CreatorAccessOptions = {
  requireActive?: boolean;
};

type CreatorAccessDenial = "UNAUTHENTICATED" | "NOT_CREATOR" | "NOT_ACTIVE" | "ADMIN";

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
  ADMIN: "Admins haben kein Model-Profil. Nutze \"Als Model ansehen\" im Admin-Bereich.",
};

function deny(reason: CreatorAccessDenial): CreatorAccess {
  return {
    allowed: false,
    reason,
    message: denialMessages[reason],
  };
}

/**
 * Creator = MODEL that is not suspended. Admins are not creators; they act as a model only via impersonation,
 * in which case the session already carries the model's id.
 * With `requireActive`, the model must additionally be approved (modelStatus ACTIVE).
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
    return deny("ADMIN");
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
  ADMIN: "/admin",
};

export async function requireCreatorPage(options: CreatorAccessOptions = {}) {
  const access = await getCreatorAccess(options);

  if (!access.allowed) {
    redirect(denialRedirects[access.reason]);
  }

  return access;
}

export type AdminAccess =
  | {
      allowed: true;
      userId: string;
    }
  | {
      allowed: false;
      message: string;
    };

export async function getAdminAccess(): Promise<AdminAccess> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      allowed: false,
      message: denialMessages.UNAUTHENTICATED,
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
      status: true,
    },
  });

  if (!user || user.status !== "ACTIVE" || user.role !== "ADMIN") {
    return {
      allowed: false,
      message: "Diese Funktion ist nur für Admins verfügbar.",
    };
  }

  return {
    allowed: true,
    userId: session.user.id,
  };
}

export async function requireAdminPage() {
  const access = await getAdminAccess();

  if (!access.allowed) {
    notFound();
  }

  return access;
}
