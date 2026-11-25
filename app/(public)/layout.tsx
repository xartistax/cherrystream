import type { ReactNode } from "react";

import { AgeGate } from "@/components/public/age-gate";
import { PublicFooter } from "@/components/public/footer";
import { PublicNavbar } from "@/components/public/navbar";
import { ImpersonationBanner } from "@/components/shared/impersonation-banner";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-zinc-950 text-white">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-zinc-950" />

      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.18),transparent_55%)]" />

      <div className="pointer-events-none fixed -left-40 top-64 -z-10 size-[30rem] rounded-full bg-fuchsia-600/8 blur-3xl" />

      <div className="pointer-events-none fixed -right-40 top-96 -z-10 size-[30rem] rounded-full bg-rose-600/8 blur-3xl" />

      <ImpersonationBanner />

      <PublicNavbar />

      <main className="relative flex-1">{children}</main>

      <PublicFooter />

      <AgeGate />
    </div>
  );
}
