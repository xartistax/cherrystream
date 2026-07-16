import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function hashString(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

export async function trackProfileView(profileUserId: string): Promise<void> {
  try {
    const session = await auth();

    if (session?.user?.id === profileUserId) {
      return;
    }

    const requestHeaders = await headers();

    const forwardedFor = requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip") ?? "unknown";

    const ip = forwardedFor.split(",")[0]?.trim() ?? "unknown";

    const userAgent = requestHeaders.get("user-agent") ?? "unknown";

    const today = new Date().toISOString().slice(0, 10);

    const visitorHash = hashString(`${ip}:${userAgent}:${today}`);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const alreadyTracked = await prisma.profileView.findFirst({
      where: {
        profileUserId,
        visitorHash,
        viewedAt: {
          gte: startOfDay,
        },
      },
      select: {
        id: true,
      },
    });

    if (alreadyTracked) {
      return;
    }

    await prisma.profileView.create({
      data: {
        profileUserId,
        viewerId: session?.user?.id,
        visitorHash,
      },
    });
  } catch (error) {
    console.error("Failed to track profile view:", error);
  }
}
