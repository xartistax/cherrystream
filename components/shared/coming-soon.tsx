import { Construction } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type ComingSoonProps = {
  title: string;
  description: string;
};

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <Card className="border-white/10 bg-zinc-900/60 text-white">
        <CardContent className="flex flex-col items-center px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400">
            <Construction className="size-6" />
          </div>

          <h1 className="mt-5 text-2xl font-bold">{title}</h1>

          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
