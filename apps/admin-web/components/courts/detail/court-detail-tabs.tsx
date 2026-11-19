"use client";

import { CalendarCheck, LayoutDashboard } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  courtDetailBase,
  courtDetailHref,
  resolveCourtDetailTab,
  type CourtDetailTabId,
} from "@/components/courts/detail/court-detail-nav";
import { useCourtDetail } from "@/components/courts/detail/court-detail-context";
import { EntityDetailTabs, type EntityDetailTabItem } from "@/components/entity/detail-tabs";
import { usePathname } from "@/i18n/navigation";

const TAB_ICONS: Record<CourtDetailTabId, typeof LayoutDashboard> = {
  overview: LayoutDashboard,
  bookings: CalendarCheck,
};

export function CourtDetailTabs() {
  const t = useTranslations("organization.court.tabs");
  const { courtId } = useCourtDetail();
  const pathname = usePathname();
  const base = courtDetailBase(courtId);
  const active = resolveCourtDetailTab(pathname, base);

  const tabs = useMemo<EntityDetailTabItem[]>(
    () =>
      (Object.keys(TAB_ICONS) as CourtDetailTabId[]).map((id) => {
        const Icon = TAB_ICONS[id];
        return {
          id,
          label: t(id),
          href: courtDetailHref(courtId, id),
          active: active === id,
          icon: <Icon />,
        };
      }),
    [active, courtId, t],
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
