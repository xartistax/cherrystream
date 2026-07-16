import { startOfDay, startOfWeek } from "date-fns";

import { prisma } from "@/lib/prisma";

export type ProfileStats = {
  totalViews: number;
  todayViews: number;
  weekViews: number;
  followers: number;
  posts: number;
  totalContacts: number;
  todayContacts: number;
  weekContacts: number;
  todayConversionRate: number;
  weekConversionRate: number;
  totalConversionRate: number;
};

function calculateConversionRate(contacts: number, views: number): number {
  if (views === 0) {
    return 0;
  }

  return Math.min(100, (contacts / views) * 100);
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const now = new Date();
  const today = startOfDay(now);
  const week = startOfWeek(now, {
    weekStartsOn: 1,
  });

  const [totalViews, todayViews, weekViews, followers, posts, totalContacts, todayContacts, weekContacts] = await Promise.all([
    prisma.profileView.count({
      where: {
        profileUserId: userId,
      },
    }),

    prisma.profileView.count({
      where: {
        profileUserId: userId,
        viewedAt: {
          gte: today,
        },
      },
    }),

    prisma.profileView.count({
      where: {
        profileUserId: userId,
        viewedAt: {
          gte: week,
        },
      },
    }),

    prisma.follow.count({
      where: {
        followingId: userId,
      },
    }),

    prisma.post.count({
      where: {
        authorId: userId,
        status: "PUBLISHED",
      },
    }),

    prisma.contactClick.count({
      where: {
        profileUserId: userId,
      },
    }),

    prisma.contactClick.count({
      where: {
        profileUserId: userId,
        clickedAt: {
          gte: today,
        },
      },
    }),

    prisma.contactClick.count({
      where: {
        profileUserId: userId,
        clickedAt: {
          gte: week,
        },
      },
    }),
  ]);

  return {
    totalViews,
    todayViews,
    weekViews,
    followers,
    posts,
    totalContacts,
    todayContacts,
    weekContacts,
    todayConversionRate: calculateConversionRate(todayContacts, todayViews),
    weekConversionRate: calculateConversionRate(weekContacts, weekViews),
    totalConversionRate: calculateConversionRate(totalContacts, totalViews),
  };
}
