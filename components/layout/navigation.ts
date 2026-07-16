import { Bell, Compass, CreditCard, Home, MessageCircle, Settings, UserRound } from "lucide-react";

export const navigationItems = [
  {
    label: "Studio",
    href: "/studio",
    icon: Home,
  },
  {
    label: "Entdecken",
    href: "/explore",
    icon: Compass,
  },
  {
    label: "Nachrichten",
    href: "/messages",
    icon: MessageCircle,
  },
  {
    label: "Benachrichtigungen",
    href: "/notifications",
    icon: Bell,
  },
  {
    label: "Credits",
    href: "/credits",
    icon: CreditCard,
  },
  {
    label: "Profil",
    href: "/profile",
    icon: UserRound,
  },
  {
    label: "Einstellungen",
    href: "/settings",
    icon: Settings,
  },
] as const;
