"use client";

import {
  BadgeCheck,
  Clock,
  Images,
  LayoutDashboard,
  LayoutGrid,
  Tags,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, type ReactNode } from "react";

import {
  EntityDetailTabs,
  type EntityDetailTabItem,
} from "@/components/entity/detail-tabs";
import { usePathname } from "@/i18n/navigation";

import {
  BRANCH_DETAIL_TABS,
  branchDetailBase,
  resolveBranchDetailTab,
  type BranchDetailTabId,
} from "./branch-detail-nav";
import { useBranchDetail } from "./branch-detail-context";

const TAB_ICONS: Record<BranchDetailTabId, ReactNode> = {
  overview: <LayoutDashboard />,
  pricing: <Tags />,
  images: <Images />,
  courts: <LayoutGrid />,
  schedule: <Clock />,
  amenities: <BadgeCheck />,
};

export function BranchDetailTabs() {
  const t = useTranslations("organization.branchDetail.tabs");
  const td = useTranslations("organization.branchDetail");
  const { branchId } = useBranchDetail();
  const pathname = usePathname();
  const base = branchDetailBase(branchId);
  const activeId = resolveBranchDetailTab(pathname, base);

  const tabs = useMemo<EntityDetailTabItem[]>(
    () =>
      BRANCH_DETAIL_TABS.map((tab) => ({
        id: tab.id,
        label: t(tab.id),
        href: tab.segment ? `${base}/${tab.segment}` : base,
        active: tab.id === activeId,
        icon: TAB_ICONS[tab.id],
      })),
    [activeId, base, t],
  );

  return (
    <EntityDetailTabs
      tabs={tabs}
      ariaLabel={t("ariaLabel")}
      title={td("navTitle")}
      variant="vertical"
      className="p-2 md:p-2.5"
    />
  );
}
