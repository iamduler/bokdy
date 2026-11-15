"use client";

import { Button, cn } from "@bokdy/ui";
import { Building2, LayoutGrid, MapPin, Pencil, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { softDirectoryPrimaryBtn } from "@/components/data-list";
import {
  EntityDetailHero,
  EntityDetailHeroKpi,
  EntityDetailHeroMeta,
} from "@/components/entity/detail-hero";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import { useProvinces, useWards } from "@/hooks/use-admin-units";
import type { OrganizationType } from "@/lib/api/admin";

import { OrganizationFormSheet } from "../../organization-form-sheet";
import { useOrganizationDetail } from "../organization-detail-context";

const ORGANIZATION_TYPES = new Set<OrganizationType>([
  "company",
  "club",
  "school",
  "government",
  "individual",
  "other",
]);

/** Soft cover hero for org overview: banner, overlapping logo, identity, KPIs. */
export function OrganizationOverviewHeader() {
  const t = useTranslations("organization");
  const tm = useTranslations("organization.detailMetrics");
  const tShell = useTranslations("shell");
  const { org } = useOrganizationDetail();
  const [editing, setEditing] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setBannerFailed(false);
  }, [org.banner_file_id]);
  useEffect(() => {
    setLogoFailed(false);
  }, [org.logo_file_id]);

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

  const logoSrc = org.logo_file_id && !logoFailed ? `/api/go/files/${org.logo_file_id}` : null;
  const bannerSrc = org.banner_file_id && !bannerFailed ? `/api/go/files/${org.banner_file_id}` : null;
  const subtitle = [org.slug, org.primary_sport].filter(Boolean).join(" · ");

  return (
    <>
      <EntityDetailHero
        backHref="/organizations"
        backLabel={tShell("menuBack")}
        name={org.name}
        bannerSrc={bannerSrc}
        logoSrc={logoSrc}
        onBannerError={() => setBannerFailed(true)}
        onLogoError={() => setLogoFailed(true)}
        badges={
          <>
            <OrganizationStatusBadge kind="org" status={org.status} />
            {orgType ? <SoftStatusChip label={t(`type.${orgType}`)} tone="muted" /> : null}
          </>
        }
        subtitle={
          subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null
        }
        edit={
          org.status === "archived" ? null : (
            <Button
              type="button"
              size="lg"
              className={cn(softDirectoryPrimaryBtn, "shrink-0")}
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-4" aria-hidden />
              {t("detailOverview.editProfile")}
            </Button>
          )
        }
        meta={
          <>
            {place ? (
              <EntityDetailHeroMeta icon={<MapPin className="size-4 shrink-0" aria-hidden />}>
                {place}
              </EntityDetailHeroMeta>
            ) : null}
            {org.owner_display_name ? (
              <EntityDetailHeroMeta icon={<UserRound className="size-4 shrink-0" aria-hidden />}>
                {t("detailOverview.ownerLabel")}: {org.owner_display_name}
              </EntityDetailHeroMeta>
            ) : null}
          </>
        }
        kpis={
          <>
            <EntityDetailHeroKpi
              value={org.branch_count ?? 0}
              label={tm("branches")}
              icon={<Building2 className="size-3.5" aria-hidden />}
            />
            <EntityDetailHeroKpi
              value={org.court_count ?? 0}
              label={tm("courts")}
              icon={<LayoutGrid className="size-3.5" aria-hidden />}
            />
          </>
        }
      />
      <OrganizationFormSheet
        open={editing}
        mode="edit"
        organization={org}
        onOpenChange={(open) => {
          if (!open) setEditing(false);
        }}
      />
    </>
  );
}
