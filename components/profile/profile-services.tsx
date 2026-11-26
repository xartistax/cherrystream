import { ListChecks } from "lucide-react";
import Link from "next/link";

type ProfileServicesProps = {
  groups: Array<{
    group: string;
    label: string;
    services: Array<{
      name: string;
      slug: string;
    }>;
  }>;
};

/** The model's "Angebote"; each one links to all profiles offering it. */
export function ProfileServices({ groups }: ProfileServicesProps) {
  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 shadow-xl shadow-black/10">
      <div className="border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
            <ListChecks className="size-4" />
          </div>

          <h2 className="font-bold text-white">Angebote</h2>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-8">
        {groups.map((group) => (
          <div key={group.group}>
            {groups.length > 1 ? <p className="mb-2.5 text-xs font-medium tracking-wide text-zinc-500 uppercase">{group.label}</p> : null}

            <div className="flex flex-wrap gap-2">
              {group.services.map((service) => (
                <Link
                  key={service.slug}
                  href={`/explore?service=${service.slug}`}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-zinc-200 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-200"
                >
                  {service.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
