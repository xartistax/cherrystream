import { ShieldCheck } from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdminPage } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Admin",
};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdminPage();

  const pendingVerifications = await prisma.modelVerification.count({
    where: {
      status: "PENDING",
    },
  });

  return (
    <div className="space-y-8">
      <header className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
            <ShieldCheck className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Admin</h1>

            <p className="text-sm text-zinc-500">Systemstatus, Prüfungen und Moderation</p>
          </div>
        </div>

        <AdminNav pendingVerifications={pendingVerifications} />
      </header>

      {children}
    </div>
  );
}
