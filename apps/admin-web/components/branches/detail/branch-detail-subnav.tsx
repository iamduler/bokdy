"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  BRANCH_DETAIL_TABS,
  branchDetailBase,
  resolveBranchDetailTab,
  type BranchDetailTabId,
} from "@/components/branches/detail/branch-detail-nav";
import { useBranchDetail } from "@/components/branches/detail/branch-detail-context";
import { EntityDetailSubnav } from "@/components/entity/detail-subnav";
import { useAdminOrganization } from "@/hooks/use-admin-organizations";
import { usePathname } from "@/i18n/navigation";

/** Soft crumbs for top-level `/branches/:id` — full parent trail from branch.organization_id. */
export function BranchDetailSubnav() {
  const t = useTranslations("organization.detailSubnav");
  const tBranch = useTranslations("organization.branchDetail.tabs");
  const { branch, organizationId, branchId } = useBranchDetail();
  const pathname = usePathname();
  const base = branchDetailBase(branchId);
  const orgHref = `/organizations/${organizationId}`;
  const branchesHref = `${orgHref}/branches`;
  const { data: org } = useAdminOrganization(organizationId);

  const crumbs = useMemo(() => {
    const orgName = org?.name ?? organizationId;
    const tab = resolveBranchDetailTab(pathname, base);
    const isKnownTab = BRANCH_DETAIL_TABS.some((item) => item.id === tab);

    if (tab === "overview" || !isKnownTab) {
      return [
        { label: orgName, href: orgHref },
        { label: t("crumbBranches"), href: branchesHref },
        { label: branch.name },
      ];
    }

    return [
      { label: orgName, href: orgHref },
      { label: t("crumbBranches"), href: branchesHref },
      { label: branch.name, href: base },
      { label: tBranch(tab as BranchDetailTabId) },
    ];
  }, [
    base,
    branch.name,
    branchesHref,
    org?.name,
    orgHref,
    organizationId,
    pathname,
    t,
    tBranch,
  ]);

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
