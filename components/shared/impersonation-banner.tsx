import { Eye, LogOut } from "lucide-react";

import { stopImpersonationAction } from "@/actions/admin/impersonation";
import { auth } from "@/lib/auth";

export async function ImpersonationBanner() {
  const session = await auth();
  const impersonatedBy = session?.user?.impersonatedBy;

  if (!session?.user || !impersonatedBy) {
    return null;
  }

  return (
    <div className="relative z-50 border-b border-amber-500/30 bg-amber-500/15 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-sm text-amber-100 sm:px-6">
        <p className="flex items-center gap-2">
          <Eye className="size-4 shrink-0" />
          <span>
            Du siehst CherryStream als <strong>@{session.user.username}</strong> (angemeldet als Admin @{impersonatedBy.username}). Endet automatisch
            nach 1 Stunde.
          </span>
        </p>

        <form action={stopImpersonationAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 font-medium text-amber-50 transition hover:bg-amber-500/30"
          >
            <LogOut className="size-3.5" />
            Ansicht beenden
          </button>
        </form>
      </div>
    </div>
  );
}
