import { ChevronDown, CircleUserRound } from "lucide-react";
import Link from "next/link";

import { getNavigationItems } from "@/components/layout/navigation";
import { LogoutMenuItem } from "@/components/shared/logout-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRole } from "@/generated/prisma/enums";

type UserMenuProps = {
  username: string;
  role: UserRole;
};

export function UserMenu({ username, role }: UserMenuProps) {
  const menuItems = getNavigationItems(role).filter((item) => (role === "ADMIN" ? item.href === "/admin" || item.href === "/settings" : item.href !== "/dashboard"));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="gap-2 text-zinc-300 hover:bg-white/5 hover:text-white" aria-label="Benutzermenü öffnen" />}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-white/10">
          <CircleUserRound className="size-5" />
        </span>

        <span className="hidden max-w-32 truncate text-sm sm:inline">@{username}</span>

        <ChevronDown className="hidden size-4 text-zinc-500 sm:block" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>@{username}</DropdownMenuLabel>
        </DropdownMenuGroup>

        {menuItems.length > 0 && (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                    <Icon className="size-4" />
                    {item.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <LogoutMenuItem />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
