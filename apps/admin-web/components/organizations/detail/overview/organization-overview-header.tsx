"use client";

import { Button } from "@bokdy/ui";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import { softDirectoryPrimaryBtn } from "@/components/data-list";
import { EntityAvatar } from "@/components/entity/avatar";
import { EntityIdentityHeader } from "@/components/entity/identity-header";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import { useProvinces, useWards } from "@/hooks/use-admin-units";
import { Link } from "@/i18n/navigation";
import type { OrganizationType } from "@/lib/api/admin";

import { useOrganizationDetail } from "../organization-detail-context";

const ORGANIZATION_TYPES = new Set<OrganizationType>([
  "company",
  "club",
  "school",
  "government",
  "individual",
  "other",
]);

export function OrganizationOverviewHeader() {
  const t = useTranslations("organization");
  const tShell = useTranslations("shell");
  const { org, orgId } = useOrganizationDetail();
  const provinceId = org.headquarters?.province_id;
  const wardId = org.headquarters?.ward_id;
  const { data: provinces = [] } = useProvinces("current_v2");
  const { data: wards = [] } = useWards({
    scheme: "current_v2",
    provinceId: provinceId || undefined,
  });
  const provinceName = provinces.find((unit) => unit.id === provinceId)?.name;
  const wardName = wards.find((unit) => unit.id === wardId)?.name;
  const place = [wardName, provinceName].filter(Boolean).join(", ");
  const orgType = ORGANIZATION_TYPES.has(
    org.organization_type as OrganizationType,
  )
    ? (org.organization_type as OrganizationType)
    : null;

  return (
    <EntityIdentityHeader
      backHref="/organizations"
      backLabel={tShell("menuBack")}
      avatar={
        org.logo_file_id ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/go/files/${org.logo_file_id}`}
            alt=""
            className="size-14 shrink-0 rounded-full object-cover ring-1 ring-black/5"
          />
        ) : (
          <EntityAvatar name={org.name} size="lg" />
        )
      }
      title={org.name}
      badges={
        <>
          <OrganizationStatusBadge kind="org" status={org.status} />
          {orgType ? (
            <SoftStatusChip label={t(`type.${orgType}`)} tone="muted" />
          ) : null}
        </>
      }
      meta={
        <p className="truncate text-sm text-muted-foreground">
          {[org.slug, place].filter(Boolean).join(" · ")}
        </p>
      }
      actions={
        <Button asChild size="lg" className={softDirectoryPrimaryBtn}>
          <Link href={`/organizations/${orgId}/edit`}>
            <Pencil className="size-4" aria-hidden />
            {t("detailOverview.editProfile")}
          </Link>
        </Button>
      }
    />
  );
}
