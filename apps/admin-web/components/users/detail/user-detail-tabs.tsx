"use client";

import {
  Building2,
  CalendarCheck,
  History,
  KeyRound,
  LayoutDashboard,
  Monitor,
  Shield,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, type ReactNode } from "react";

import {
  EntityDetailTabs,
  type EntityDetailTabItem,
} from "@/components/entity/detail-tabs";
import { useUserDetail } from "@/components/users/detail/user-detail-context";
import { usePathname } from "@/i18n/navigation";
import type { UserAudience } from "@/lib/api/admin-users";

export const USER_DETAIL_TABS: Record<UserAudience, { id: string; suffix: string }[]> = {
  players: [
    { id: "overview", suffix: "" },
    { id: "bookings", suffix: "/bookings" },
    { id: "sessions", suffix: "/sessions" },
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

const TAB_ICONS: Record<string, ReactNode> = {
  overview: <LayoutDashboard />,
  bookings: <CalendarCheck />,
  sessions: <Monitor />,
  organizations: <Building2 />,
  permissions: <KeyRound />,
  activity: <History />,
  security: <Shield />,
};

export function UserDetailTabs() {
  const t = useTranslations("users.detailSubnav");
  const { audience, userId } = useUserDetail();
  const pathname = usePathname();
  const base = `/users/${audience}/${userId}`;
  const segment = pathname.startsWith(base)
    ? pathname.slice(base.length).split("/").filter(Boolean)[0]
    : undefined;

  const tabs = useMemo<EntityDetailTabItem[]>(
    () =>
      USER_DETAIL_TABS[audience].map((tab) => ({
        id: tab.id,
        label: t(tab.id),
        href: `${base}${tab.suffix}`,
        active: tab.suffix === "" ? !segment : segment === tab.suffix.slice(1),
        icon: TAB_ICONS[tab.id],
      })),
    [audience, base, segment, t],
  );

  return (
    <EntityDetailTabs
      tabs={tabs}
      ariaLabel={t("ariaLabel")}
      title={t("navTitle")}
      variant="vertical"
      className="p-2 md:p-2.5"
    />
  );
}
