import { createHash } from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ContactChannel = "PHONE" | "WHATSAPP" | "TELEGRAM" | "SIGNAL" | "WEBSITE" | "INSTAGRAM" | "EMAIL";

type RouteContext = {
  params: Promise<{
    username: string;
    channel: string;
  }>;
};

const channelMap: Record<string, ContactChannel> = {
  phone: "PHONE",
  whatsapp: "WHATSAPP",
  telegram: "TELEGRAM",
  signal: "SIGNAL",
  website: "WEBSITE",
  instagram: "INSTAGRAM",
  email: "EMAIL",
};

function normalizePhoneNumber(value: string): string {
  return value.replace(/[^\d+]/g, "").replace(/^00/, "+");
}

function createVisitorHash(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  const ip = forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";

  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const day = new Date().toISOString().slice(0, 10);

  return createHash("sha256").update(`${ip}:${userAgent}:${day}`).digest("hex");
}

function createRedirectResponse(target: string): Response {
  return new Response(null, {
    status: 307,
    headers: {
      Location: target,
      "Cache-Control": "no-store",
    },
  });
}

function createContactTarget(input: {
  channel: ContactChannel;
  displayName: string;
  phoneNumber: string | null;
  telegramUsername: string | null;
  signalNumber: string | null;
  website: string | null;
  instagram: string | null;
  emailPublic: string | null;
}): string | null {
  const { channel, displayName, phoneNumber, telegramUsername, signalNumber, website, instagram, emailPublic } = input;

  switch (channel) {
    case "PHONE": {
      if (!phoneNumber) {
        return null;
      }

      return `tel:${normalizePhoneNumber(phoneNumber)}`;
    }

    case "WHATSAPP": {
      if (!phoneNumber) {
        return null;
      }

      const number = normalizePhoneNumber(phoneNumber).replace(/^\+/, "");

      const url = new URL(`https://wa.me/${number}`);

      url.searchParams.set("text", `Hallo ${displayName}, ich habe dein Profil auf CherryStream gesehen.`);

      return url.toString();
    }

    case "TELEGRAM": {
      if (!telegramUsername) {
        return null;
      }

      const username = telegramUsername.replace(/^@+/, "");

      return `https://t.me/${encodeURIComponent(username)}`;
    }

    case "SIGNAL": {
      if (!signalNumber) {
        return null;
      }

      const number = normalizePhoneNumber(signalNumber);

      return `https://signal.me/#p/${encodeURIComponent(number)}`;
    }

    case "WEBSITE": {
      return website;
    }

    case "INSTAGRAM": {
      if (!instagram) {
        return null;
      }

      const username = instagram.replace(/^@+/, "");

      return `https://www.instagram.com/${encodeURIComponent(username)}/`;
    }

    case "EMAIL": {
      if (!emailPublic) {
        return null;
      }

      const subject = encodeURIComponent(`Kontakt über CherryStream – ${displayName}`);

      return `mailto:${emailPublic}?subject=${subject}`;
    }
  }
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { username, channel: rawChannel } = await params;

  const channel = channelMap[rawChannel.toLowerCase()];

  const fallbackUrl = new URL(`/profile/${encodeURIComponent(username)}`, request.url);

  if (!channel) {
    return NextResponse.redirect(fallbackUrl);
  }

  const profileUser = await prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      username: true,
      status: true,
      profile: {
        select: {
          displayName: true,
          isPublic: true,

          phoneNumber: true,
          phoneEnabled: true,
          whatsappEnabled: true,

          telegramUsername: true,
          telegramEnabled: true,

          signalNumber: true,
          signalEnabled: true,

          website: true,
          websiteEnabled: true,

          instagram: true,
          instagramEnabled: true,

          emailPublic: true,
          emailEnabled: true,
        },
      },
    },
  });

  if (!profileUser || profileUser.status !== "ACTIVE" || !profileUser.profile?.isPublic) {
    return NextResponse.redirect(fallbackUrl);
  }

  const enabledChannels: Record<ContactChannel, boolean> = {
    PHONE: profileUser.profile.phoneEnabled,
    WHATSAPP: profileUser.profile.whatsappEnabled,
    TELEGRAM: profileUser.profile.telegramEnabled,
    SIGNAL: profileUser.profile.signalEnabled,
    WEBSITE: profileUser.profile.websiteEnabled,
    INSTAGRAM: profileUser.profile.instagramEnabled,
    EMAIL: profileUser.profile.emailEnabled,
  };

  if (!enabledChannels[channel]) {
    return NextResponse.redirect(fallbackUrl);
  }

  const target = createContactTarget({
    channel,
    displayName: profileUser.profile.displayName || profileUser.username,
    phoneNumber: profileUser.profile.phoneNumber,
    telegramUsername: profileUser.profile.telegramUsername,
    signalNumber: profileUser.profile.signalNumber,
    website: profileUser.profile.website,
    instagram: profileUser.profile.instagram,
    emailPublic: profileUser.profile.emailPublic,
  });

  if (!target) {
    return NextResponse.redirect(fallbackUrl);
  }

  const session = await auth();

  if (session?.user?.id !== profileUser.id) {
    try {
      await prisma.contactClick.create({
        data: {
          profileUserId: profileUser.id,
          visitorId: session?.user?.id ?? null,
          channel,
          visitorHash: createVisitorHash(request),
        },
      });
    } catch (error: unknown) {
      console.error("Contact click tracking failed:", error);
    }
  }

  return createRedirectResponse(target);
}
