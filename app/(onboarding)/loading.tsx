import { Cherry } from "lucide-react";

export default function OnboardingLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-zinc-950 text-white">
      <div className="flex flex-col items-center gap-4">
        <span className="flex size-12 animate-pulse items-center justify-center rounded-2xl bg-rose-500 shadow-lg shadow-rose-500/20">
          <Cherry className="size-5" />
        </span>

        <span className="text-sm text-zinc-500">Wird geladen …</span>
      </div>
    </div>
  );
}
