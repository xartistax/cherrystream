"use client";

import { useState, useTransition } from "react";
import { Bell, Eye, Mail, Megaphone, MousePointerClick } from "lucide-react";

import { updateNotificationSetting, type NotificationSetting } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

type NotificationSettingsValues = Record<NotificationSetting, boolean>;

type NotificationSettingsFormProps = {
  initialValues: NotificationSettingsValues;
};

const emailSettings = [
  {
    key: "accountEmails",
    title: "Konto-E-Mails",
    description: "Erhalte wichtige Hinweise zu deinem Konto und deiner Sicherheit.",
    icon: Mail,
  },
  {
    key: "marketingEmails",
    title: "Neuigkeiten und Angebote",
    description: "Erhalte Informationen zu neuen Funktionen und CherryStream-Neuigkeiten.",
    icon: Megaphone,
  },
] satisfies ReadonlyArray<{
  key: NotificationSetting;
  title: string;
  description: string;
  icon: typeof Bell;
}>;

const activitySettings = [
  {
    key: "profileViews",
    title: "Profilaufrufe",
    description: "Informiere mich über neue Aufrufe meines Profils.",
    icon: Eye,
  },
  {
    key: "contactClicks",
    title: "Kontaktklicks",
    description: "Informiere mich, wenn ein Besucher eine Kontaktmöglichkeit verwendet.",
    icon: MousePointerClick,
  },
] satisfies ReadonlyArray<{
  key: NotificationSetting;
  title: string;
  description: string;
  icon: typeof Bell;
}>;

export function NotificationSettingsForm({ initialValues }: NotificationSettingsFormProps) {
  const [values, setValues] = useState<NotificationSettingsValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [pendingSetting, setPendingSetting] = useState<NotificationSetting | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(setting: NotificationSetting, enabled: boolean) {
    const previousValue = values[setting];

    setError(null);
    setPendingSetting(setting);
    setValues((current) => ({
      ...current,
      [setting]: enabled,
    }));

    startTransition(async () => {
      const result = await updateNotificationSetting(setting, enabled);

      if (!result.success) {
        setValues((current) => ({
          ...current,
          [setting]: previousValue,
        }));
        setError(result.error);
      }

      setPendingSetting(null);
    });
  }

  return (
    <div className="space-y-6">
      <SettingsCard
        title="E-Mail-Benachrichtigungen"
        description="Lege fest, welche Nachrichten wir dir per E-Mail senden dürfen."
        icon={Mail}
        settings={emailSettings}
        values={values}
        isPending={isPending}
        pendingSetting={pendingSetting}
        onChange={handleChange}
      />

      <SettingsCard
        title="Aktivität"
        description="Bestimme, über welche Aktivitäten du informiert werden möchtest."
        icon={Bell}
        settings={activitySettings}
        values={values}
        isPending={isPending}
        pendingSetting={pendingSetting}
        onChange={handleChange}
      />

      {error ? (
        <p role="alert" className="text-sm text-rose-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type SettingsCardProps = {
  title: string;
  description: string;
  icon: typeof Bell;
  settings: ReadonlyArray<{
    key: NotificationSetting;
    title: string;
    description: string;
    icon: typeof Bell;
  }>;
  values: NotificationSettingsValues;
  isPending: boolean;
  pendingSetting: NotificationSetting | null;
  onChange: (setting: NotificationSetting, enabled: boolean) => void;
};

function SettingsCard({ title, description, icon: SectionIcon, settings, values, isPending, pendingSetting, onChange }: SettingsCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
            <SectionIcon className="size-5" />
          </div>

          <div>
            <CardTitle className="text-lg text-white">{title}</CardTitle>
            <CardDescription className="mt-1 text-zinc-500">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="divide-y divide-white/10">
        {settings.map((setting) => {
          const Icon = setting.icon;
          const disabled = isPending && pendingSetting === setting.key;

          return (
            <div key={setting.key} className="flex items-center gap-4 py-5 first:pt-0 last:pb-0">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                <Icon className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{setting.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">{setting.description}</p>
              </div>

              <Switch
                checked={values[setting.key]}
                disabled={disabled}
                aria-label={setting.title}
                onCheckedChange={(checked) => onChange(setting.key, checked)}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
