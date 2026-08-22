"use client";

import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { useLogout } from "@/hooks/use-auth";

function initialsFrom(email: string | undefined, displayName: string | undefined): string {
  const name = displayName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "A";
}

export function UserMenu({
  email,
  displayName,
}: {
  email?: string;
  displayName?: string;
}) {
  const t = useTranslations("shell");
  const tc = useTranslations("common");
  const router = useRouter();
  const logout = useLogout();

  async function onLogout() {
    await logout.mutateAsync().catch(() => undefined);
    router.push("/login");
    router.refresh();
  }

  const initials = initialsFrom(email, displayName);
  const label = displayName?.trim() || email || t("profile");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-2 px-1.5"
          aria-label={t("userMenu")}
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-40 truncate text-xs font-medium sm:inline">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-0.5 font-normal">
          <p className="truncate text-sm font-semibold text-foreground">{label}</p>
          {email && displayName?.trim() ? (
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">{t("nav.profile")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/sessions">{t("nav.sessions")}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={logout.isPending}
          onSelect={(event) => {
            event.preventDefault();
            void onLogout();
          }}
        >
          {tc("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
