import { FileText } from "lucide-react";

type ProfileDescriptionProps = {
  html: string;
  displayName: string;
};

export function ProfileDescription({ html, displayName }: ProfileDescriptionProps) {
  return (
    <section className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 shadow-xl shadow-black/10">
      <div className="border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
            <FileText className="size-4" />
          </div>

          <div>
            <h2 className="font-bold text-white">Über {displayName}</h2>

            <p className="mt-0.5 text-xs text-zinc-500">Persönliche Vorstellung und wichtige Informationen</p>
          </div>
        </div>
      </div>

      <div
        className={[
          "px-5 py-6 text-[15px] leading-7 text-zinc-300 sm:px-8 sm:py-8",
          "[&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:tracking-tight [&_h2]:text-white first:[&_h2]:mt-0",
          "[&_h3]:mb-3 [&_h3]:mt-7 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white",
          "[&_p]:my-4",
          "[&_strong]:font-semibold [&_strong]:text-white",
          "[&_em]:text-zinc-200",
          "[&_s]:text-zinc-500",
          "[&_ul]:my-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6",
          "[&_ol]:my-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6",
          "[&_li::marker]:text-rose-400",
          "[&_blockquote]:my-6 [&_blockquote]:rounded-r-2xl [&_blockquote]:border-l-2 [&_blockquote]:border-rose-500/60 [&_blockquote]:bg-rose-500/5 [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:italic [&_blockquote]:text-zinc-400",
        ].join(" ")}
        dangerouslySetInnerHTML={{
          __html: html,
        }}
      />
    </section>
  );
}
