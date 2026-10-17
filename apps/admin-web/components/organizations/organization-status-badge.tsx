"use client";

import { useTranslations } from "next-intl";

import { EntityStatusBadge } from "@/components/entity/status-badge";
import type { OrgStatus, TenantStatus } from "@/lib/api/admin";

const BLUE =
  "border-transparent bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
const GREEN =
  "border-transparent bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300";
const SKY =
  "border-transparent bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300";
const PURPLE =
  "border-transparent bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
const RED =
  "border-transparent bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";

const ORG_STATUS_CLASS: Record<OrgStatus, string> = {
  active: GREEN,
  inactive: BLUE,
  suspended: RED,
  archived: PURPLE,
};

const TENANT_STATUS_CLASS: Record<TenantStatus, string> = {
  trial: SKY,
  active: GREEN,
  suspended: RED,
  canceled: RED,
};

type OrganizationStatusBadgeProps =
  | { kind: "org"; status: OrgStatus }
  | { kind: "tenant"; status: TenantStatus };

export function OrganizationStatusBadge(props: OrganizationStatusBadgeProps) {
  const tOrg = useTranslations("organization.status");
  const tTenant = useTranslations("organization.tenantStatus");

  if (props.kind === "org") {
    return <EntityStatusBadge className={ORG_STATUS_CLASS[props.status]} label={tOrg(props.status)} />;
  }

  return <EntityStatusBadge className={TENANT_STATUS_CLASS[props.status]} label={tTenant(props.status)} />;
}
