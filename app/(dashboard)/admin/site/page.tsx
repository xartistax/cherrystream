import { Globe } from "lucide-react";

import { SiteSettings } from "@/components/admin/site-settings";
import { getAppUrl } from "@/lib/email/templates";
import { getComingSoonSetting } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function AdminSitePage() {
  const setting = await getComingSoonSetting({ fresh: true });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <Globe className="size-5 text-rose-400" />
          Website
        </h2>

        <p className="mt-1 text-sm text-zinc-500">Gilt für alle Besucher. Änderungen stehen im Protokoll.</p>
      </div>

      <SiteSettings comingSoon={setting.enabled} previewUrl={setting.previewKey ? getAppUrl(`/preview?key=${setting.previewKey}`) : null} />
    </div>
  );
}
