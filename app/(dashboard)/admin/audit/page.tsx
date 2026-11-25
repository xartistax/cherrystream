import { format } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import type { AdminAction } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const actionLabels: Record<AdminAction, string> = {
  VERIFICATION_APPROVED: "Verifizierung freigegeben",
  VERIFICATION_REJECTED: "Verifizierung abgelehnt",
  USER_SUSPENDED: "Benutzer gesperrt",
  USER_REACTIVATED: "Benutzer entsperrt",
  POST_HIDDEN: "Upload ausgeblendet",
  POST_RESTORED: "Upload eingeblendet",
  INVITE_CREATED: "Einladung erstellt",
  INVITE_RENEWED: "Einladungslink erneuert",
  INVITE_REVOKED: "Einladung widerrufen",
  IMPERSONATION_STARTED: "Als Model angesehen (Start)",
  IMPERSONATION_STOPPED: "Model-Ansicht beendet",
  REPORT_RESOLVED: "Meldung erledigt",
  REPORT_DISMISSED: "Meldung verworfen",
};

function describeTarget(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") {
    return "";
  }

  const values = metadata as Record<string, unknown>;
  const name = values.username ?? values.author;

  if (typeof name === "string") {
    return `@${name}`;
  }

  return typeof values.displayName === "string" ? values.displayName : "";
}

export default async function AdminAuditPage() {
  const entries = await prisma.adminAuditLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      metadata: true,
      createdAt: true,
      actor: {
        select: {
          username: true,
        },
      },
    },
  });

  return (
    <Card className="border-white/10 bg-zinc-900/70 text-white">
      <CardContent className="divide-y divide-white/5 p-0">
        {entries.length === 0 ? <p className="p-6 text-sm text-zinc-500">Noch keine Admin-Aktionen.</p> : null}

        {entries.map((entry) => (
          <div key={entry.id} className="flex flex-col gap-1 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p>
              <span className="font-medium">{actionLabels[entry.action]}</span> <span className="text-zinc-400">{describeTarget(entry.metadata)}</span>
            </p>

            <p className="text-zinc-500">
              von @{entry.actor?.username ?? "unbekannt"} · {format(entry.createdAt, "dd.MM.yyyy HH:mm")}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
