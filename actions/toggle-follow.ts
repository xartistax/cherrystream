"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ToggleFollowResult = {
  success: boolean;
  following: boolean;
  followerCount: number;
  message?: string;
};

export async function toggleFollowAction(username: string): Promise<ToggleFollowResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      following: false,
      followerCount: 0,
      message: "Bitte melde dich an, um Profile zu merken.",
    };
  }

  const normalizedUsername = username.trim().toLowerCase();

  if (!normalizedUsername) {
    return {
      success: false,
      following: false,
      followerCount: 0,
      message: "Das Profil wurde nicht gefunden.",
    };
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: {
        username: normalizedUsername,
      },
      select: {
        id: true,
        username: true,
        status: true,
        profile: {
          select: {
            isPublic: true,
          },
        },
      },
    });

    if (!targetUser || targetUser.status !== "ACTIVE" || !targetUser.profile?.isPublic) {
      return {
        success: false,
        following: false,
        followerCount: 0,
        message: "Das Profil wurde nicht gefunden.",
      };
    }

    if (targetUser.id === session.user.id) {
      const followerCount = await prisma.follow.count({
        where: {
          followingId: targetUser.id,
        },
      });

      return {
        success: false,
        following: false,
        followerCount,
        message: "Du kannst dein eigenes Profil nicht merken.",
      };
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUser.id,
        },
      },
      select: {
        followerId: true,
      },
    });

    const following = await prisma.$transaction(async (transaction) => {
      if (existingFollow) {
        await transaction.follow.delete({
          where: {
            followerId_followingId: {
              followerId: session.user.id,
              followingId: targetUser.id,
            },
          },
        });

        return false;
      }

      await transaction.follow.create({
        data: {
          followerId: session.user.id,
          followingId: targetUser.id,
        },
      });

      return true;
    });

    const followerCount = await prisma.follow.count({
      where: {
        followingId: targetUser.id,
      },
    });

    revalidatePath(`/profile/${targetUser.username}`);
    revalidatePath("/explore");
    revalidatePath("/dashboard");

    return {
      success: true,
      following,
      followerCount,
    };
  } catch (error) {
    console.error("Toggle follow failed:", error);

    return {
      success: false,
      following: false,
      followerCount: 0,
      message: "Die Favoriten konnten nicht geändert werden.",
    };
  }
}
