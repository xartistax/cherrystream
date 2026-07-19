import { Bell, CircleUserRound, Compass, CreditCard, FileImage, LayoutDashboard, MessageCircle, Settings, UserRound, type LucideIcon } from "lucide-react";

import type { ModelStatus, UserRole } from "@/generated/prisma/enums";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export function getDashboardButton(role: UserRole) {
  if (role === "USER") {
    return {
      label: "Mitglied werden",
      href: "/become-model",
    };
  }

  return {
    label: "Dashboard",
    href: "/dashboard",
  };
}

export function getNavigationItems(role: UserRole, isBecomeModelFlow = false): NavigationItem[] {
  if (isBecomeModelFlow && role === "USER") {
    return [
      {
        label: "Mitglied werden",
        href: "/become-model",
        icon: CircleUserRound,
      },
    ];
  }
  const roleItem: NavigationItem =
    role === "MODEL" || role === "ADMIN"
      ? {
          label: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        }
      : {
          label: "Mitglied werden",
          href: "/become-model",
          icon: CircleUserRound,
        };

  return [
    roleItem,

    {
      label: "Inhalte",
      href: "/dashboard/posts",
      icon: FileImage,
    },
    {
      label: "Profil",
      href: "/profile/edit",
      icon: UserRound,
    },
    {
      label: "Credits",
      href: "/credits",
      icon: CreditCard,
    },

    {
      label: "Benachrichtigungen",
      href: "/notifications",
      icon: Bell,
    },
    {
      label: "Einstellungen",
      href: "/settings",
      icon: Settings,
    },
  ];
}
