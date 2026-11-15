"use client";

import { useTranslations } from "next-intl";

import { MappedStatusBadge } from "@/components/entity/mapped-status-badge";
import type { SoftStatusToneKey } from "@/components/entity/soft-status-chip";
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

/** Domain wrapper around MappedStatusBadge for org / tenant lifecycle. */
export function OrganizationStatusBadge(props: OrganizationStatusBadgeProps) {
  const tOrg = useTranslations("organization.status");
  const tTenant = useTranslations("organization.tenantStatus");

  if (props.kind === "org") {
    return (
      <MappedStatusBadge
        status={props.status}
        tones={ORG_TONE}
        label={(status) => tOrg(status)}
      />
    );
  }

  return (
    <MappedStatusBadge
      status={props.status}
      tones={TENANT_TONE}
      label={(status) => tTenant(status)}
    />
  );
}
