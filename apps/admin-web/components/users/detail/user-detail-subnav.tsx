"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI user detail
 */

import { useTranslations } from "next-intl";

import { EntityDetailSubnav } from "@/components/entity/detail-subnav";
import {
  useUserDetail,
  userDisplayName,
} from "@/components/users/detail/user-detail-context";
import { USER_DETAIL_TABS } from "@/components/users/detail/user-detail-tabs";
import { usePathname } from "@/i18n/navigation";

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

  const activeTab = USER_DETAIL_TABS[audience].find(
    (tab) => tab.suffix !== "" && segment === tab.suffix.slice(1),
  );
  const crumbs = activeTab
    ? [
        { label: name, href: base },
        { label: t(activeTab.id) },
      ]
    : [{ label: name }];

  return (
    <EntityDetailSubnav
      root={{ href: `/users/${audience}`, label: tu(`audience.${audience}`) }}
      crumbs={crumbs}
    />
  );
}
