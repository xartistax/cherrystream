import { RefreshButton } from "@/components/admin/refresh-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { type CheckStatus, getDeploymentInfo, getSystemStatus } from "@/lib/admin/system-status";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function getOverallStatus(statuses: CheckStatus[]): { status: CheckStatus; title: string; description: string } {
  const errors = statuses.filter((status) => status === "error").length;
  const warnings = statuses.filter((status) => status === "warn").length;

  if (errors > 0) {
    return {
      status: "error",
      title: `${errors} System${errors === 1 ? "" : "e"} mit Fehler`,
      description: "Mindestens ein wichtiges System funktioniert nicht. Details unten.",
    };
  }

  if (warnings > 0) {
    return {
      status: "warn",
      title: "Alles läuft, mit Hinweisen",
      description: `${warnings} Punkt${warnings === 1 ? "" : "e"} sollte${warnings === 1 ? "" : "n"} angeschaut werden.`,
    };
  }

  return {
    status: "ok",
    title: "Alle Systeme laufen",
    description: "Alle Prüfungen sind erfolgreich.",
  };
}

export default async function AdminStatusPage() {
  const groups = await getSystemStatus();
  const deployment = getDeploymentInfo();
  const overall = getOverallStatus(groups.flatMap((group) => group.checks.map((check) => check.status)));
  const checkedAt = new Date().toLocaleTimeString("de-CH");

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between",
          overall.status === "error" && "border-rose-500/20 bg-rose-500/10",
          overall.status === "warn" && "border-amber-500/20 bg-amber-500/10",
          overall.status === "ok" && "border-emerald-500/20 bg-emerald-500/10",
        )}
      >
        <div className="flex items-start gap-3">
          <StatusBadge status={overall.status} />

          <div>
            <p className="font-semibold text-white">{overall.title}</p>

            <p className="mt-1 text-sm text-zinc-400">
              {overall.description} Geprüft um {checkedAt}.
            </p>
          </div>
        </div>

        <RefreshButton />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.title} className="border-white/10 bg-zinc-900/70 text-white">
            <CardContent className="p-5">
              <h2 className="mb-4 text-sm font-semibold tracking-wide text-zinc-400 uppercase">{group.title}</h2>

              <ul className="divide-y divide-white/5">
                {group.checks.map((check) => (
                  <li key={check.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-medium">{check.label}</p>

                      <p className="mt-0.5 text-sm break-words text-zinc-500">{check.detail}</p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={check.status} />

                      {check.latencyMs !== undefined && check.status !== "disabled" ? (
                        <span className="text-xs text-zinc-600">{check.latencyMs} ms</span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/10 bg-zinc-900/70 text-white">
        <CardContent className="p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-zinc-400 uppercase">Deployment</h2>

          <dl className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {deployment.map((item) => (
              <div key={item.label}>
                <dt className="text-xs text-zinc-500">{item.label}</dt>

                <dd className="mt-1 font-mono text-sm break-all text-white">{item.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
