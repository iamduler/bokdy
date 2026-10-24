"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  EntityDetailTabs,
  type EntityDetailTabItem,
} from "@/components/entity/detail-tabs";
import { usePathname } from "@/i18n/navigation";

import { useOrganizationDetail } from "../organization-detail-context";

const TABS = [
  { id: "overview", href: "", labelKey: "overview" },
  { id: "branches", href: "/branches", labelKey: "branches" },
  { id: "courts", href: "/courts", labelKey: "courts" },
  { id: "team", href: "/team", labelKey: "team" },
  { id: "billing", href: "/billing", labelKey: "billing" },
  { id: "activity", href: "/activity", labelKey: "activity" },
  { id: "actions", href: "/actions", labelKey: "actions" },
  { id: "audit", href: null, labelKey: "audit" },
] as const;

export function OrganizationOverviewTabs() {
  const t = useTranslations("organization.detailTabs");
  const { orgId } = useOrganizationDetail();
  const pathname = usePathname();
  const base = `/organizations/${orgId}`;

  const tabs = useMemo<EntityDetailTabItem[]>(
    () =>
      TABS.map((tab) => {
        const isOverview = tab.id === "overview";
        const active = isOverview
          ? pathname === base || pathname.endsWith(base)
          : Boolean(tab.href && pathname.includes(tab.href));

        return {
          id: tab.id,
          label: t(tab.labelKey),
          href: tab.href !== null ? `${base}${tab.href}` : undefined,
          active,
          disabled: tab.href === null,
        };
      }),
    [base, pathname, t],
  );

  return <EntityDetailTabs tabs={tabs} ariaLabel={t("overview")} />;
}
