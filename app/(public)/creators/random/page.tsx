import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RandomCreatorPage() {
  const where = {
    status: "ACTIVE" as const,
    profile: {
      is: {
        isPublic: true,
      },
    },
  };

  const creatorCount = await prisma.user.count({
    where,
  });

  if (creatorCount === 0) {
    redirect("/creators");
  }

  const skip = Math.floor(Math.random() * creatorCount);

  const creator = await prisma.user.findFirst({
    where,
    select: {
      username: true,
    },
    orderBy: {
      id: "asc",
    },
    skip,
  });

  redirect(creator ? `/profile/${creator.username}` : "/creators");
}
