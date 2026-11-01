"use client";

import { ChevronDown, KeyRound, LogOut } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { signOutAction } from "@/lib/actions/auth";

type UserMenuProps = {
  name: string;
  email: string;
  roleLabel: string;
  /** False for the Super Admin, whose password is managed in .env. */
  canChangePassword: boolean;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ name, email, roleLabel, canChangePassword }: UserMenuProps) {
  const [isSigningOut, startSignOut] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-9 gap-2 px-1.5 md:px-2"
            aria-label="Open user menu"
          />
        }
      >
        <Avatar size="sm">
          <AvatarFallback>{getInitials(name) || "U"}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-40 truncate text-sm font-medium md:inline">
          {name}
        </span>
        <ChevronDown className="hidden text-muted-foreground md:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-1 py-2 font-normal">
            <span className="truncate text-sm font-medium text-foreground">
              {name}
            </span>
            <span className="truncate text-xs">{email}</span>
            <Badge variant="secondary" className="mt-1 w-fit">
              {roleLabel}
            </Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {canChangePassword && (
          <DropdownMenuItem render={<Link href="/change-password" />}>
            <KeyRound />
            Change password
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          disabled={isSigningOut}
          onClick={() => startSignOut(() => signOutAction())}
        >
          <LogOut />
          {isSigningOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
