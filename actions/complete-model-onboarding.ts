"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, ModelStatus } from "@/generated/prisma/enums";

export async function completeModelOnboardingAction() {
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

      profile: {
        select: {
          displayName: true,
          bio: true,

          cantonId: true,
          cityId: true,

          canton: {
            select: {
              name: true,
            },
          },

          city: {
            select: {
              name: true,
            },
          },

          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (!user.profile?.displayName) {
    redirect("/become-model/profile");
  }

  if (!user.profile.cantonId || !user.profile.cityId) {
    redirect("/become-model/location");
  }

  if (user.profile.categories.length === 0) {
    redirect("/become-model/categories");
  }

  await prisma.user.update({
    where: {
      id: session.user.id,
    },

    data: {
      role: UserRole.MODEL,

      modelStatus: ModelStatus.ACTIVE,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/become-model");
  revalidatePath(`/profile/${user.username}`);
  revalidatePath("/");

  redirect("/dashboard");
}
