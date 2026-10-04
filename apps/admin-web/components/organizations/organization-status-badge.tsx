"use client";

import { Badge } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import type { OrgStatus, TenantStatus } from "@/lib/api/admin";

const ORG_STATUS_CLASS: Record<OrgStatus, string> = {
  active: "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  inactive: "",
  suspended: "border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-300",
  archived: "",
};

const ORG_STATUS_VARIANT: Record<OrgStatus, "secondary" | "outline" | "default"> = {
  active: "default",
  inactive: "secondary",
  suspended: "default",
  archived: "outline",
};

const TENANT_STATUS_CLASS: Record<TenantStatus, string> = {
  trial: "border-transparent bg-sky-500/15 text-sky-800 dark:text-sky-300",
  active: "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  suspended: "border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-300",
  canceled: "border-transparent bg-destructive/15 text-destructive",
};

type OrganizationStatusBadgeProps =
  | { kind: "org"; status: OrgStatus }
  | { kind: "tenant"; status: TenantStatus };

export function OrganizationStatusBadge(props: OrganizationStatusBadgeProps) {
  const tOrg = useTranslations("organization.status");
  const tTenant = useTranslations("organization.tenantStatus");

  if (props.kind === "org") {
    return (
      <Badge
        variant={ORG_STATUS_VARIANT[props.status]}
        className={ORG_STATUS_CLASS[props.status] || undefined}
      >
        {tOrg(props.status)}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={TENANT_STATUS_CLASS[props.status]}>
      {tTenant(props.status)}
    </Badge>
  );
}
