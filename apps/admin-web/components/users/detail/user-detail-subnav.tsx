"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI user detail
 */

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { EntityDetailSubnav } from "@/components/entity/detail-subnav";
import {
  EntityDetailTabs,
  type EntityDetailTabItem,
} from "@/components/entity/detail-tabs";
import {
  useUserDetail,
  userDisplayName,
} from "@/components/users/detail/user-detail-context";
import { usePathname } from "@/i18n/navigation";
import type { UserAudience } from "@/lib/api/admin-users";

const TAB_CONFIG: Record<UserAudience, { id: string; suffix: string }[]> = {
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

export function UserDetailSubnav() {
  const t = useTranslations("users.detailSubnav");
  const tu = useTranslations("users");
  const { audience, user, userId } = useUserDetail();
  const pathname = usePathname();
  const base = `/users/${audience}/${userId}`;
  const name = userDisplayName(user);
  const segment = pathname.startsWith(base)
    ? pathname.slice(base.length).split("/").filter(Boolean)[0]
    : undefined;

  const tabs = useMemo<EntityDetailTabItem[]>(
    () =>
      TAB_CONFIG[audience].map((tab) => ({
        id: tab.id,
        label: t(tab.id),
        href: `${base}${tab.suffix}`,
        active: tab.suffix === "" ? !segment : segment === tab.suffix.slice(1),
      })),
    [audience, base, segment, t],
  );

  const activeTab = TAB_CONFIG[audience].find(
    (tab) => tab.suffix !== "" && segment === tab.suffix.slice(1),
  );
  const crumbs = activeTab
    ? [
        { label: name, href: base },
        { label: t(activeTab.id) },
      ]
    : [{ label: name }];

  return (
    <>
      <EntityDetailSubnav
        root={{ href: `/users/${audience}`, label: tu(`audience.${audience}`) }}
        crumbs={crumbs}
      />
      <EntityDetailTabs tabs={tabs} ariaLabel={t("overview")} />
    </>
  );
}
