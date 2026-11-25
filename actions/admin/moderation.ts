"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminAccess } from "@/lib/access";
import { logAdminAction } from "@/lib/admin/audit";
import { syncProfileImage } from "@/lib/gallery/profile-image";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().min(1);

export async function setUserSuspendedAction(formData: FormData): Promise<void> {
  const access = await getAdminAccess();

  if (!access.allowed) {
    throw new Error(access.message);
  }

  const userId = idSchema.parse(formData.get("userId"));
  const suspend = formData.get("suspend") === "true";

  if (userId === access.userId) {
    throw new Error("Du kannst dein eigenes Konto nicht sperren.");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      role: true,
      status: true,
      username: true,
    },
  });

  if (!user || user.status === "DELETED") {
    throw new Error("Benutzer nicht gefunden.");
  }

  if (user.role === "ADMIN") {
    throw new Error("Admins können nicht gesperrt werden.");
  }

  if ((user.status === "SUSPENDED") === suspend) {
    return;
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.user.update({
      where: {
        id: userId,
      },
      data: {
        status: suspend ? "SUSPENDED" : "ACTIVE",
      },
    });

    // Suspended users are signed out: the JWT callback rejects non-active users, sessions are cleared too.
    if (suspend) {
      await transaction.session.deleteMany({
        where: {
          userId,
        },
      });
    }

    await logAdminAction(transaction, {
      actorId: access.userId,
      action: suspend ? "USER_SUSPENDED" : "USER_REACTIVATED",
      targetType: "User",
      targetId: userId,
      metadata: {
        username: user.username,
      },
    });
  });

  revalidatePath("/admin/users");
  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath(`/profile/${user.username}`);
}

export async function setPostHiddenAction(formData: FormData): Promise<void> {
  const access = await getAdminAccess();

  if (!access.allowed) {
    throw new Error(access.message);
  }

  const postId = idSchema.parse(formData.get("postId"));
  const hide = formData.get("hide") === "true";

  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
    select: {
      status: true,
      authorId: true,
      author: {
        select: {
          username: true,
        },
      },
    },
  });

  if (!post || post.status === "DELETED") {
    throw new Error("Beitrag nicht gefunden.");
  }

  if ((post.status === "HIDDEN") === hide) {
    return;
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.post.update({
      where: {
        id: postId,
      },
      data: {
        status: hide ? "HIDDEN" : "PUBLISHED",
      },
    });

    await logAdminAction(transaction, {
      actorId: access.userId,
      action: hide ? "POST_HIDDEN" : "POST_RESTORED",
      targetType: "Post",
      targetId: postId,
      metadata: {
        author: post.author.username,
      },
    });
  });

  // A hidden image can no longer be the profile picture: a chosen one is forgotten and the oldest visible image takes over.
  await syncProfileImage(post.authorId);

  revalidatePath("/admin/posts");
  revalidatePath(`/profile/${post.author.username}`);
  revalidatePath("/explore");
}
