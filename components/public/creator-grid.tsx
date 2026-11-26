import { CreatorCard, type CreatorCardData } from "@/components/public/creator-card";

type CreatorGridProps = {
  creators: CreatorCardData[];
  priorityCount?: number;
};

export function CreatorGrid({ creators, priorityCount = 8 }: CreatorGridProps) {
  if (creators.length === 0) {
    return (
      <div className="flex min-h-[28rem] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-zinc-900/40">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-white">Keine Ladies gefunden</h2>

          <p className="mt-3 text-zinc-500">In dieser Auswahl ist gerade niemand online. Versuch es mit dem ganzen Kanton oder einer anderen Rubrik.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {creators.map((creator, index) => (
        <CreatorCard key={creator.username} creator={creator} priority={index < priorityCount} />
      ))}
    </div>
  );
}
