"use client";

import { Badge, Button } from "@bokdy/ui";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import { EntityAvatar } from "@/components/entity/avatar";
import { EntityIdentityHeader } from "@/components/entity/identity-header";
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
  const orgType = ORGANIZATION_TYPES.has(org.organization_type as OrganizationType)
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
            className="size-14 shrink-0 rounded-full border border-border object-cover"
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
            <Badge variant="secondary" className="text-[11px] font-bold">
              {t(`type.${orgType}`)}
            </Badge>
          ) : null}
        </>
      }
      meta={
        <p className="truncate text-xs text-muted-foreground">
          {[org.slug, place].filter(Boolean).join(" · ")}
        </p>
      }
      actions={
        <Button asChild size="sm" className="h-8 gap-1.5 text-xs">
          <Link href={`/organizations/${orgId}/edit`}>
            <Pencil className="h-3.5 w-3.5" />
            {t("detailOverview.editProfile")}
          </Link>
        </Button>
      }
    />
  );
}
