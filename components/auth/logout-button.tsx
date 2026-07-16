import { LogOut } from "lucide-react";

import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";

        await signOut({
          redirectTo: "/login",
        });
      }}
    >
      <Button type="submit" variant="ghost" size="icon" aria-label="Abmelden" className="text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400">
        <LogOut className="size-4" />
      </Button>
    </form>
  );
}
