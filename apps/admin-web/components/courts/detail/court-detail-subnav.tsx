"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { useCourtDetail } from "@/components/courts/detail/court-detail-context";
import { EntityDetailSubnav } from "@/components/entity/detail-subnav";
import { useAdminOrganization } from "@/hooks/use-admin-organizations";
import { useBranch } from "@/hooks/use-branches";

/** Soft crumbs for top-level `/courts/:id` — trail from organization_id + branch_id. */
export function CourtDetailSubnav() {
  const t = useTranslations("organization.detailSubnav");
  const { court, organizationId } = useCourtDetail();
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
    items.push({ label: t("crumbCourts"), href: courtsHref }, { label: court.name });
    return items;
  }, [branch, court.name, courtsHref, org?.name, orgHref, organizationId, t]);

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
