"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { EntityDetailSubnav } from "@/components/entity/detail-subnav";
import { usePricingProfileDetail } from "@/components/pricing-profiles/pricing-profile-context";
import { useAdminOrganization } from "@/hooks/use-admin-organizations";
import { useBranch } from "@/hooks/use-branches";

export function PricingProfileSubnav() {
  const t = useTranslations("organization.detailSubnav");
  const { profile, organizationId, branchId } = usePricingProfileDetail();
  const orgHref = `/organizations/${organizationId}`;
  const { data: org } = useAdminOrganization(organizationId);
  const { data: branch } = useBranch(branchId, organizationId);

  const crumbs = useMemo(() => {
    const orgName = org?.name ?? organizationId;
    const branchName = branch?.name ?? branchId;
    return [
      { label: orgName, href: orgHref },
      { label: t("crumbBranches"), href: `${orgHref}/branches` },
      { label: branchName, href: `/branches/${branchId}` },
      { label: t("crumbPricing"), href: `/branches/${branchId}/pricing` },
      { label: profile.name },
    ];
  }, [branch?.name, branchId, org?.name, orgHref, organizationId, profile.name, t]);

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
