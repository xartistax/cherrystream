import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type LegalPageProps = {
  title: string;
  updatedAt: string;
  children: ReactNode;
};

/** Layout for imprint, privacy policy and terms. The drafts must be replaced by reviewed texts before launch. */
export function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-10 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
        <TriangleAlert className="mt-0.5 size-5 shrink-0" />
        <p>
          <strong>Entwurf.</strong> Dieser Text ist ein Platzhalter und noch nicht rechtlich geprüft. Markierte Stellen müssen vor dem Livegang ergänzt
          und der gesamte Text von einer Fachperson geprüft werden.
        </p>
      </div>

      <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h1>

      <p className="mt-2 text-sm text-zinc-500">Stand: {updatedAt}</p>

      <div className="mt-10 space-y-8 text-[15px] leading-7 text-zinc-300 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_a]:text-rose-400 [&_a]:underline-offset-4 [&_a:hover]:underline [&_li]:ml-5 [&_li]:list-disc [&_mark]:rounded [&_mark]:bg-amber-500/20 [&_mark]:px-1 [&_mark]:text-amber-200 [&_ul]:space-y-1">
        {children}
      </div>
    </article>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return <mark>[PLATZHALTER: {children}]</mark>;
}
