import { redirect } from "next/navigation";

import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SocialLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      username: true,
      name: true,
      image: true,
      wallet: {
        select: {
          userCredits: true,
        },
      },
      profile: {
        select: {
          displayName: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const socialUser = {
    username: user.username,
    displayName: user.profile?.displayName ?? user.name ?? user.username,
    image: user.image,
    role: session.user.role,
    credits: user.wallet?.userCredits ?? 0,
  };

  return (
    <div className="min-h-svh bg-zinc-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.08),transparent_30%)]" />

      <Sidebar user={socialUser} />

      <div className="relative lg:pl-72">
        <Topbar user={socialUser} />

        <main className="mx-auto min-h-[calc(100svh-4rem)] max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:pb-8">{children}</main>
      </div>

      <MobileNav role={session.user.role} />
    </div>
  );
}
