import { CircleUserRound, CreditCard, FileImage, LayoutDashboard, Settings, UserRound, type LucideIcon } from "lucide-react";

import type { UserRole } from "@/generated/prisma/enums";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export function isCreatorRole(role: UserRole) {
  return role === "MODEL" || role === "ADMIN";
}

export function getDashboardButton(role: UserRole) {
  if (!isCreatorRole(role)) {
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

const becomeModelItem: NavigationItem = {
  label: "Mitglied werden",
  href: "/become-model",
  icon: CircleUserRound,
};

const creditsItem: NavigationItem = {
  label: "Credits",
  href: "/credits",
  icon: CreditCard,
};

const settingsItem: NavigationItem = {
  label: "Einstellungen",
  href: "/settings",
  icon: Settings,
};

export function getNavigationItems(role: UserRole, isBecomeModelFlow = false): NavigationItem[] {
  if (!isCreatorRole(role)) {
    if (isBecomeModelFlow) {
      return [becomeModelItem];
    }

    return [becomeModelItem, creditsItem, settingsItem];
  }

  return [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
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
    creditsItem,
    settingsItem,
  ];
}
