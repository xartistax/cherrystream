import { format } from "date-fns";
import { Search } from "lucide-react";

import { setUserSuspendedAction } from "@/actions/admin/moderation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ModelStatus, UserRole, UserStatus } from "@/generated/prisma/enums";
import { requireAdminPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AdminUsersPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

const roleLabels: Record<UserRole, string> = {
  USER: "User",
  MODEL: "Model",
  ADMIN: "Admin",
};

const modelStatusLabels: Record<ModelStatus, string | null> = {
  NONE: null,
  PENDING: "in Prüfung",
  ACTIVE: "freigegeben",
  SUSPENDED: "gesperrt",
};

const statusStyles: Record<UserStatus, string> = {
  ACTIVE: "text-emerald-300",
  SUSPENDED: "text-rose-300",
  DELETED: "text-zinc-500",
};

const statusLabels: Record<UserStatus, string> = {
  ACTIVE: "aktiv",
  SUSPENDED: "gesperrt",
  DELETED: "gelöscht",
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { userId: adminId } = await requireAdminPage();
  const query = (await searchParams).q?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            {
              email: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              username: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              profile: {
                is: {
                  displayName: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : undefined,
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      modelStatus: true,
      createdAt: true,
      profile: {
        select: {
          displayName: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <form className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />

        <Input name="q" defaultValue={query} placeholder="E-Mail, Benutzername oder Name" className="border-white/10 bg-white/5 pl-9 text-white" />
      </form>

      <Card className="border-white/10 bg-zinc-900/70 text-white">
        <CardContent className="divide-y divide-white/5 p-0">
          {users.length === 0 ? <p className="p-6 text-sm text-zinc-500">Keine Benutzer gefunden.</p> : null}

          {users.map((user) => {
            const canModerate = user.id !== adminId && user.role !== "ADMIN" && user.status !== "DELETED";
            const modelStatus = user.role === "MODEL" ? modelStatusLabels[user.modelStatus] : null;

            return (
              <div key={user.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">
                    {user.profile?.displayName ?? user.username} <span className="text-zinc-500">@{user.username}</span>
                  </p>

                  <p className="mt-0.5 truncate text-sm text-zinc-500">
                    {user.email} · {roleLabels[user.role]}
                    {modelStatus ? ` (${modelStatus})` : null} · seit {format(user.createdAt, "dd.MM.yyyy")} ·{" "}
                    <span className={cn(statusStyles[user.status])}>{statusLabels[user.status]}</span>
                  </p>
                </div>

                {canModerate ? (
                  <form action={setUserSuspendedAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="suspend" value={user.status === "SUSPENDED" ? "false" : "true"} />

                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "border-white/10 bg-white/5",
                        user.status === "SUSPENDED" ? "text-emerald-300 hover:text-emerald-200" : "text-rose-300 hover:text-rose-200",
                      )}
                    >
                      {user.status === "SUSPENDED" ? "Entsperren" : "Sperren"}
                    </Button>
                  </form>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
