"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { plainTextToParagraphs } from "@/lib/invites/draft";
import { getOpenInvite } from "@/lib/invites/get-open-invite";
import { hashContact } from "@/lib/invites/token";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, formatRetryAfter, getRequestIpHash } from "@/lib/rate-limit";
import { sanitizeProfileDescription } from "@/lib/sanitize-profile-description";

export type ClaimInviteState = {
  success: boolean;
  message?: string;
};

class InviteNoLongerOpenError extends Error {}

export async function claimInviteAction(_previousState: ClaimInviteState, formData: FormData): Promise<ClaimInviteState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Bitte melde dich an, um das Profil zu übernehmen.",
    };
  }

  const limit = await consumeRateLimit(`invite:${await getRequestIpHash()}`, 20, 60 * 60);

  if (!limit.allowed) {
    return {
      success: false,
      message: `Zu viele Versuche. Bitte versuche es ${formatRetryAfter(limit.retryAfterSeconds)} erneut.`,
    };
  }

  if (formData.get("consent") !== "on") {
    return {
      success: false,
      message: "Bitte bestätige, dass du das Profil übernehmen möchtest.",
    };
  }

  const token = formData.get("token");
  const invite = typeof token === "string" ? await getOpenInvite(token) : null;

  if (!invite) {
    return {
      success: false,
      message: "Diese Einladung ist abgelaufen oder wurde bereits verwendet.",
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      status: true,
      modelStatus: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return {
      success: false,
      message: "Dein Konto ist nicht aktiv.",
    };
  }

  if (user.role !== "USER" || user.modelStatus !== "NONE") {
    return {
      success: false,
      message: "Dein Konto hat bereits ein Model-Profil. Melde dich mit einem anderen Konto an oder lehne die Einladung ab.",
    };
  }

  const bio = invite.bio ? sanitizeProfileDescription(plainTextToParagraphs(invite.bio)).html : null;

  const contactData = {
    cantonId: invite.cantonId,
    cityId: invite.cityId,
    phoneNumber: invite.phoneNumber,
    whatsappEnabled: invite.whatsappEnabled,
    telegramUsername: invite.telegramUsername,
    telegramEnabled: Boolean(invite.telegramUsername),
    instagram: invite.instagram,
    instagramEnabled: Boolean(invite.instagram),
    website: invite.website,
    websiteEnabled: Boolean(invite.website),
    preferredContact: invite.whatsappEnabled ? ("WHATSAPP" as const) : null,
    ...(bio ? { bio } : {}),
  };

  try {
    await prisma.$transaction(async (transaction) => {
      // The status condition makes a second claim of the same link fail instead of creating two models.
      const claimed = await transaction.modelInvite.updateMany({
        where: {
          id: invite.id,
          status: "OPEN",
        },
        data: {
          status: "CLAIMED",
          claimedById: user.id,
          claimedAt: new Date(),
        },
      });

      if (claimed.count === 0) {
        throw new InviteNoLongerOpenError();
      }

      // The display name chosen at registration wins over the prepared one.
      const profile = await transaction.profile.upsert({
        where: {
          userId: user.id,
        },
        create: {
          userId: user.id,
          displayName: user.name ?? invite.displayName,
          ...contactData,
        },
        update: contactData,
        select: {
          id: true,
        },
      });

      await transaction.profileCategory.deleteMany({
        where: {
          profileId: profile.id,
        },
      });

      if (invite.categoryIds.length > 0) {
        await transaction.profileCategory.createMany({
          data: invite.categoryIds.map((categoryId) => ({
            profileId: profile.id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }

      await transaction.user.update({
        where: {
          id: user.id,
        },
        data: {
          role: "MODEL",
          modelStatus: "PENDING",
        },
      });
    });
  } catch (error) {
    if (error instanceof InviteNoLongerOpenError) {
      return {
        success: false,
        message: "Diese Einladung wurde bereits verwendet.",
      };
    }

    console.error("Claim invite failed:", error);

    return {
      success: false,
      message: "Das Profil konnte nicht übernommen werden.",
    };
  }

  revalidatePath("/admin/invites");
  revalidatePath("/dashboard");

  redirect("/dashboard/verification");
}

/** "Not interested": deletes the draft right away and blocks future invites for this phone number. Works without an account. */
export async function declineInviteAction(formData: FormData): Promise<void> {
  const limit = await consumeRateLimit(`invite:${await getRequestIpHash()}`, 20, 60 * 60);

  if (!limit.allowed) {
    throw new Error("Zu viele Versuche. Bitte versuche es später erneut.");
  }

  const token = formData.get("token");
  const invite = typeof token === "string" ? await getOpenInvite(token) : null;

  if (invite) {
    await prisma.$transaction(async (transaction) => {
      if (invite.phoneNumber) {
        await transaction.declinedContact.upsert({
          where: {
            contactHash: hashContact(invite.phoneNumber),
          },
          create: {
            contactHash: hashContact(invite.phoneNumber),
          },
          update: {},
        });
      }

      await transaction.modelInvite.deleteMany({
        where: {
          id: invite.id,
          status: "OPEN",
        },
      });
    });

    revalidatePath("/admin/invites");
  }

  redirect("/claim/declined");
}
