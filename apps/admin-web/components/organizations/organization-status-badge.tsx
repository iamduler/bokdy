"use client";

import { useTranslations } from "next-intl";

import {
  SoftStatusChip,
  type SoftStatusToneKey,
} from "@/components/entity/soft-status-chip";
import type { OrgStatus, TenantStatus } from "@/lib/api/admin";

const ORG_TONE: Record<OrgStatus, SoftStatusToneKey> = {
  active: "emerald",
  inactive: "sky",
  suspended: "rose",
  archived: "violet",
};

const TENANT_TONE: Record<TenantStatus, SoftStatusToneKey> = {
  trial: "sky",
  active: "emerald",
  suspended: "rose",
  canceled: "rose",
};

type OrganizationStatusBadgeProps =
  | { kind: "org"; status: OrgStatus }
  | { kind: "tenant"; status: TenantStatus };

/** Domain wrapper around SoftStatusChip for org / tenant lifecycle. */
export function OrganizationStatusBadge(props: OrganizationStatusBadgeProps) {
  const tOrg = useTranslations("organization.status");
  const tTenant = useTranslations("organization.tenantStatus");

  if (props.kind === "org") {
    return (
      <SoftStatusChip
        label={tOrg(props.status)}
        tone={ORG_TONE[props.status]}
      />
    );
  }

  return (
    <SoftStatusChip
      label={tTenant(props.status)}
      tone={TENANT_TONE[props.status]}
    />
  );
}
