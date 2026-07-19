import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { DeleteAccountForm } from "./delete-account-form";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DangerPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <Link
        href="/settings"
        className={cn(
          buttonVariants({
            variant: "ghost",
          }),
          "-ml-4",
        )}
      >
        <ArrowLeft className="mr-2 size-4" />
        Einstellungen
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white">Gefahrenzone</h1>

        <p className="mt-2 text-zinc-400">Aktionen in diesem Bereich können nicht rückgängig gemacht werden.</p>
      </div>

      <DeleteAccountForm />
    </div>
  );
}
