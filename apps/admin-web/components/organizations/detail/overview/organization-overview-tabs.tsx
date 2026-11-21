"use client";

import { Button } from "@bokdy/ui";
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  History,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";

import {
  EntityDetailTabs,
  type EntityDetailTabItem,
} from "@/components/entity/detail-tabs";
import { OrganizationActionsDialog } from "@/components/organizations/detail/actions/organization-actions-dialog";
import { usePathname } from "@/i18n/navigation";

import { useOrganizationDetail } from "../organization-detail-context";

const TABS = [
  { id: "overview", href: "", labelKey: "overview" },
  { id: "branches", href: "/branches", labelKey: "branches" },
  { id: "holidays", href: "/holidays", labelKey: "holidays" },
  { id: "courts", href: "/courts", labelKey: "courts" },
  { id: "team", href: "/team", labelKey: "team" },
  { id: "bookings", href: "/bookings", labelKey: "bookings" },
  { id: "activity", href: "/activity", labelKey: "activity" },
] as const;

type OrgTabId = (typeof TABS)[number]["id"];

const TAB_ICONS: Record<OrgTabId, ReactNode> = {
  overview: <LayoutDashboard />,
  branches: <Building2 />,
  holidays: <CalendarDays />,
  courts: <LayoutGrid />,
  team: <Users />,
  bookings: <CalendarCheck />,
  activity: <History />,
};

export function OrganizationOverviewTabs() {
  const t = useTranslations("organization.detailTabs");
  const tActions = useTranslations("organization.detailActions");
  const { orgId } = useOrganizationDetail();
  const [actionsOpen, setActionsOpen] = useState(false);
  const pathname = usePathname();
  const base = `/organizations/${orgId}`;
  // First segment after the org base, so nested routes (e.g. branches/:id/courts)
  // only activate their owning tab.
  const segment = pathname.startsWith(base)
    ? pathname.slice(base.length).split("/").filter(Boolean)[0]
    : undefined;

  const tabs = useMemo<EntityDetailTabItem[]>(
    () =>
      TABS.map((tab) => {
        const isOverview = tab.id === "overview";
        const active = isOverview
          ? pathname === base || pathname.endsWith(base)
          : Boolean(tab.href && segment === tab.href.slice(1));

        return {
          id: tab.id,
          label: t(tab.labelKey),
          href: tab.href !== null ? `${base}${tab.href}` : undefined,
          active,
          disabled: tab.href === null,
          icon: TAB_ICONS[tab.id],
        };
      }),
    [base, pathname, segment, t],
  );

  return (
    <>
      <div className="flex items-center gap-1 p-2 md:flex-col md:items-stretch md:gap-0 md:p-0">
        <EntityDetailTabs
          tabs={tabs}
          ariaLabel={t("ariaLabel")}
          title={t("navTitle")}
          variant="vertical"
          className="min-w-0 flex-1 p-0 md:flex-none md:p-2.5"
        />
        <div className="shrink-0 md:border-t md:border-border/60 md:p-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="md:w-full"
            onClick={() => setActionsOpen(true)}
          >
            <ListChecks className="size-4" aria-hidden />
            {tActions("open")}
          </Button>
        </div>
      </div>
      <OrganizationActionsDialog open={actionsOpen} onOpenChange={setActionsOpen} />
    </>
  );
}
