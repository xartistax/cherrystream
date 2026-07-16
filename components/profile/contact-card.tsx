import Link from "next/link";
import { Globe2, Mail, MessageCircle, Phone, Send } from "lucide-react";

import { Button } from "@/components/ui/button";

type ContactChannel = "PHONE" | "WHATSAPP" | "TELEGRAM" | "SIGNAL" | "WEBSITE" | "INSTAGRAM" | "EMAIL";

type ContactCardProps = {
  username: string;
  disabled?: boolean;

  profile: {
    phoneEnabled: boolean;
    whatsappEnabled: boolean;

    telegramEnabled: boolean;
    signalEnabled: boolean;

    websiteEnabled: boolean;
    instagramEnabled: boolean;
    emailEnabled: boolean;

    preferredContact: ContactChannel | null;
  };
};

export function ContactCard({ username, profile, disabled }: ContactCardProps) {
  const buttons = [];

  if (profile.whatsappEnabled) {
    buttons.push({
      key: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      href: `/api/contact/${username}/whatsapp`,
      primary: profile.preferredContact === "WHATSAPP",
    });
  }

  if (profile.phoneEnabled) {
    buttons.push({
      key: "phone",
      label: "Anrufen",
      icon: Phone,
      href: `/api/contact/${username}/phone`,
      primary: profile.preferredContact === "PHONE",
    });
  }

  if (profile.telegramEnabled) {
    buttons.push({
      key: "telegram",
      label: "Telegram",
      icon: Send,
      href: `/api/contact/${username}/telegram`,
      primary: profile.preferredContact === "TELEGRAM",
    });
  }

  if (profile.websiteEnabled) {
    buttons.push({
      key: "website",
      label: "Website",
      icon: Globe2,
      href: `/api/contact/${username}/website`,
      primary: profile.preferredContact === "WEBSITE",
    });
  }

  if (profile.emailEnabled) {
    buttons.push({
      key: "email",
      label: "E-Mail",
      icon: Mail,
      href: `/api/contact/${username}/email`,
      primary: profile.preferredContact === "EMAIL",
    });
  }

  if (buttons.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {buttons.map((button) => {
        const Icon = button.icon;

        return (
          <Button
            key={button.key}
            nativeButton={false}
            render={<a href={disabled ? undefined : button.href} />}
            disabled={disabled}
            className={button.primary ? "bg-rose-600 text-white hover:bg-rose-500" : "border border-white/10 bg-white/5 text-white hover:bg-white/10"}
          >
            <Icon className="size-4" />
            {button.label}
          </Button>
        );
      })}
    </div>
  );
}
