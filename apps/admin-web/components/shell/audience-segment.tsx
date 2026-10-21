"use client";

import { cn } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

const SEGMENTS = [
  { href: "/users/players" as const, labelKey: "usersPlayers" as const },
  { href: "/users/owners" as const, labelKey: "usersOwners" as const },
  { href: "/users/admins" as const, labelKey: "usersAdmins" as const },
];

/** Soft UI pill segment for user directories (Players | Owners | Admins). */
export function AudienceSegment({ className }: { className?: string }) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const onUsers = pathname.startsWith("/users/");

  if (!onUsers) return null;

  return (
    <div
      className={cn(
        "hidden items-center rounded-full bg-muted/80 p-1 sm:inline-flex",
        className,
      )}
      role="tablist"
      aria-label={t("audienceSegment")}
    >
      {SEGMENTS.map((segment) => {
        const active =
          pathname === segment.href || pathname.startsWith(`${segment.href}/`);
        return (
          <Link
            key={segment.href}
            href={segment.href}
            role="tab"
            aria-selected={active}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`nav.${segment.labelKey}`)}
          </Link>
        );
      })}
    </div>
  );
}
