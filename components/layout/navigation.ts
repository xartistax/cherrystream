import {
  Activity,
  BadgeCheck,
  CircleUserRound,
  CreditCard,
  Flag,
  Globe,
  Heart,
  History,
  Images,
  LayoutDashboard,
  MailPlus,
  MessageCircle,
  Receipt,
  Rocket,
  Settings,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "@/generated/prisma/enums";
import { paymentsEnabled } from "@/lib/features";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/** Models are the only creators; admins act as a model only via impersonation. */
export function isCreatorRole(role: UserRole) {
  return role === "MODEL";
}

export function getDashboardButton(role: UserRole) {
  if (role === "ADMIN") {
    return {
      label: "Admin",
      href: "/admin",
    };
  }

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

const favoritesItem: NavigationItem = {
  label: "Favoriten",
  href: "/favorites",
  icon: Heart,
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

export const adminNavigationItems: NavigationItem[] = [
  {
    label: "Status",
    href: "/admin",
    icon: Activity,
  },
  {
    label: "Verifizierungen",
    href: "/admin/verifications",
    icon: BadgeCheck,
  },
  {
    label: "Meldungen",
    href: "/admin/reports",
    icon: Flag,
  },
  {
    label: "Einladungen",
    href: "/admin/invites",
    icon: MailPlus,
  },
  {
    label: "Benutzer",
    href: "/admin/users",
    icon: UsersRound,
  },
  {
    label: "Uploads",
    href: "/admin/posts",
    icon: Images,
  },
  {
    label: "Bestellungen",
    href: "/admin/orders",
    icon: Receipt,
  },
  {
    label: "Protokoll",
    href: "/admin/audit",
    icon: History,
  },
  {
    label: "Telegram",
    href: "/admin/notifications",
    icon: MessageCircle,
  },
  {
    label: "Website",
    href: "/admin/site",
    icon: Globe,
  },
];

/** Only active on an exact match, because other navigation items live below these paths. */
const exactMatchPaths = new Set(["/dashboard", "/admin"]);

export function isNavigationItemActive(href: string, pathname: string): boolean {
  if (exactMatchPaths.has(href)) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getNavigationItems(role: UserRole, isBecomeModelFlow = false): NavigationItem[] {
  if (role === "ADMIN") {
    return [...adminNavigationItems, settingsItem];
  }

  if (!isCreatorRole(role)) {
    if (isBecomeModelFlow) {
      return [becomeModelItem];
    }

    return [favoritesItem, becomeModelItem, ...(paymentsEnabled ? [creditsItem] : []), settingsItem];
  }

  return [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Galerie",
      href: "/dashboard/gallery",
      icon: Images,
    },
    {
      label: "Sichtbarkeit",
      href: "/dashboard/visibility",
      icon: Rocket,
    },
    {
      label: "Profil",
      href: "/profile/edit",
      icon: UserRound,
    },
    settingsItem,
  ];
}
