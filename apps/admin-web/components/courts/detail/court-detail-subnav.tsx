"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { useCourtDetail } from "@/components/courts/detail/court-detail-context";
import {
  COURT_DETAIL_TABS,
  courtDetailBase,
  resolveCourtDetailTab,
  type CourtDetailTabId,
} from "@/components/courts/detail/court-detail-nav";
import { EntityDetailSubnav } from "@/components/entity/detail-subnav";
import { useAdminOrganization } from "@/hooks/use-admin-organizations";
import { useBranch } from "@/hooks/use-branches";
import { usePathname } from "@/i18n/navigation";

/** Soft crumbs for top-level `/courts/:id` — trail from organization_id + branch_id. */
export function CourtDetailSubnav() {
  const t = useTranslations("organization.detailSubnav");
  const tCourt = useTranslations("organization.court.tabs");
  const { court, organizationId, courtId } = useCourtDetail();
  const pathname = usePathname();
  const base = courtDetailBase(courtId);
  const orgHref = `/organizations/${organizationId}`;
  const courtsHref = `${orgHref}/courts`;
  const { data: org } = useAdminOrganization(organizationId);
  const { data: branch } = useBranch(court.branch_id, organizationId);

  const crumbs = useMemo(() => {
    const orgName = org?.name ?? organizationId;
    const items: { label: string; href?: string }[] = [
      { label: orgName, href: orgHref },
    ];
    if (branch) {
      items.push(
        { label: t("crumbBranches"), href: `${orgHref}/branches` },
        { label: branch.name, href: `/branches/${branch.id}` },
      );
    }
    items.push({ label: t("crumbCourts"), href: courtsHref });
    const tab = resolveCourtDetailTab(pathname, base);
    const isKnownTab = COURT_DETAIL_TABS.some((item) => item.id === tab);
    if (tab === "overview" || !isKnownTab) {
      items.push({ label: court.name });
    } else {
      items.push(
        { label: court.name, href: base },
        { label: tCourt(tab as CourtDetailTabId) },
      );
    }
    return items;
  }, [base, branch, court.name, courtsHref, org?.name, orgHref, organizationId, pathname, t, tCourt]);

  return (
    <EntityDetailSubnav
      root={{
        href: "/organizations",
        label: t("organizations"),
      }}
      crumbs={crumbs}
    />
  );
}
