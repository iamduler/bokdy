"use client";

import { cn } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import { useUserDetail } from "@/components/users/detail/user-detail-context";
import { Link } from "@/i18n/navigation";
import type { UserAudience } from "@/lib/api/admin-users";

const TAB_CONFIG: Record<UserAudience, { id: string; suffix: string }[]> = {
  players: [
    { id: "overview", suffix: "" },
    { id: "sessions", suffix: "/sessions" },
    { id: "activity", suffix: "/activity" },
    { id: "security", suffix: "/security" },
  ],
  owners: [
    { id: "overview", suffix: "" },
    { id: "sessions", suffix: "/sessions" },
    { id: "organizations", suffix: "/organizations" },
    { id: "permissions", suffix: "/permissions" },
    { id: "activity", suffix: "/activity" },
    { id: "security", suffix: "/security" },
  ],
  admins: [
    { id: "overview", suffix: "" },
    { id: "sessions", suffix: "/sessions" },
    { id: "permissions", suffix: "/permissions" },
    { id: "activity", suffix: "/activity" },
    { id: "security", suffix: "/security" },
  ],
};

export function UserDetailSubnav() {
  const t = useTranslations("users.detailSubnav");
  const tu = useTranslations("users");
  const { audience, userId } = useUserDetail();
  const pathname = usePathname();
  const base = `/users/${audience}/${userId}`;
  const tabs = TAB_CONFIG[audience];

  return (
    <div className="shrink-0 border-b border-border bg-card/40 px-4 md:px-6">
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <Link href={`/users/${audience}`} className="hover:text-foreground">
          {tu(`audience.${audience}`)}
        </Link>
        <span>/</span>
        <span className="truncate text-foreground">{tu("detailSubnav.user")}</span>
      </div>
      <nav className="-mb-px flex gap-1 overflow-x-auto soft-scrollbar">
        {tabs.map((tab) => {
          const href = `${base}${tab.suffix}`;
          const active = tab.suffix === "" ? pathname.endsWith(userId) : pathname.includes(tab.suffix);
          return (
            <Link
              key={tab.id}
              href={href}
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t(tab.id)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
