import { LogOut } from "lucide-react";

import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

async function logout() {
  "use server";

  await signOut({
    redirectTo: "/login",
  });
}

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="ghost" size="icon" aria-label="Abmelden" className="text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400">
        <LogOut className="size-4" />
      </Button>
    </form>
  );
}

export function LogoutMenuItem() {
  return (
    <form action={logout} className="w-full">
      <DropdownMenuItem render={<button type="submit" />} className="w-full cursor-pointer text-rose-400 focus:bg-rose-500/10 focus:text-rose-300">
        <LogOut className="size-4" />
        Abmelden
      </DropdownMenuItem>
    </form>
  );
}
