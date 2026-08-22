"use client";

import { Badge } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import type { OrgStatus, TenantStatus } from "@/lib/api/admin";

const orgVariant: Record<OrgStatus, "success" | "secondary" | "warning" | "outline"> = {
  active: "success",
  inactive: "secondary",
  suspended: "warning",
  archived: "outline",
};

const tenantVariant: Record<TenantStatus, "info" | "success" | "warning" | "danger"> = {
  trial: "info",
  active: "success",
  suspended: "warning",
  canceled: "danger",
};

type OrganizationStatusBadgeProps =
  | { kind: "org"; status: OrgStatus }
  | { kind: "tenant"; status: TenantStatus };

export function OrganizationStatusBadge(props: OrganizationStatusBadgeProps) {
  const tOrg = useTranslations("organization.status");
  const tTenant = useTranslations("organization.tenantStatus");

  if (props.kind === "org") {
    return <Badge variant={orgVariant[props.status]}>{tOrg(props.status)}</Badge>;
  }

  return <Badge variant={tenantVariant[props.status]}>{tTenant(props.status)}</Badge>;
}
