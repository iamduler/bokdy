"use client";

import { Button, cn } from "@bokdy/ui";
import {
  ArrowLeft,
  Building2,
  LayoutGrid,
  MapPin,
  Pencil,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { softDirectoryPrimaryBtn } from "@/components/data-list";
import { EntityAvatar } from "@/components/entity/avatar";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import { usePageShellLeading } from "@/components/shell/shell-title";
import { useProvinces, useWards } from "@/hooks/use-admin-units";
import { Link } from "@/i18n/navigation";
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
  const orgType = ORGANIZATION_TYPES.has(
    org.organization_type as OrganizationType,
  )
    ? (org.organization_type as OrganizationType)
    : null;

  const back = usePageShellLeading(
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="size-9 rounded-full text-muted-foreground hover:bg-muted/70"
    >
      <Link href="/organizations" aria-label={tShell("menuBack")}>
        <ArrowLeft className="size-4" />
      </Link>
    </Button>,
  );

  const logoSrc =
    org.logo_file_id && !logoFailed
      ? `/api/go/files/${org.logo_file_id}`
      : null;
  const bannerSrc =
    org.banner_file_id && !bannerFailed
      ? `/api/go/files/${org.banner_file_id}`
      : null;

  return (
    <>
      {back}
      <div className="soft-elevated overflow-hidden rounded-3xl border-0">
        <div
          className={cn(
            "relative aspect-3/1 w-full overflow-hidden",
            !bannerSrc &&
              "bg-linear-to-br from-sky-500/20 via-sky-500/5 to-muted bg-[radial-gradient(ellipse_at_30%_20%,rgba(56,189,248,0.18),transparent_55%)]",
          )}
        >
          {bannerSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerSrc}
              alt=""
              className="size-full object-cover"
              onError={() => setBannerFailed(true)}
            />
          ) : null}
        </div>

        <div className="relative px-4 pb-3 md:px-5">
          <div className="-mt-10 mb-2 flex items-end gap-3 md:-mt-12 md:gap-4">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-full border-2 border-card bg-card shadow-sm md:size-28">
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoSrc}
                  alt=""
                  className="size-full object-cover"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <EntityAvatar
                  name={org.name}
                  size="lg"
                  className="size-full rounded-none"
                />
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-2 pb-0.5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                    {org.name}
                  </h1>
                  <OrganizationStatusBadge kind="org" status={org.status} />
                  {orgType ? (
                    <SoftStatusChip
                      label={t(`type.${orgType}`)}
                      tone="muted"
                    />
                  ) : null}
                </div>
                <p className="mt-1.5 truncate text-sm text-muted-foreground">
                  {[org.slug, org.primary_sport].filter(Boolean).join(" · ")}
                </p>
              </div>
              {org.status === "archived" ? null : (
                <Button
                  type="button"
                  size="lg"
                  className={cn(softDirectoryPrimaryBtn, "shrink-0")}
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="size-4" aria-hidden />
                  {t("detailOverview.editProfile")}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2.5 border-t border-border/40 pt-2.5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-1 text-sm text-muted-foreground">
              {place ? (
                <p className="flex items-start gap-2">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0 text-sky-600"
                    aria-hidden
                  />
                  <span className="text-foreground/80">{place}</span>
                </p>
              ) : null}
              {org.owner_display_name ? (
                <p className="flex items-start gap-2">
                  <UserRound
                    className="mt-0.5 size-4 shrink-0 text-sky-600"
                    aria-hidden
                  />
                  <span className="text-foreground/80">
                    {t("detailOverview.ownerLabel")}: {org.owner_display_name}
                  </span>
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 gap-5 sm:gap-6">
              <div className="text-center sm:text-right">
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {org.branch_count ?? 0}
                </p>
                <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground sm:justify-end">
                  <Building2 className="size-3.5" aria-hidden />
                  {tm("branches")}
                </p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {org.court_count ?? 0}
                </p>
                <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground sm:justify-end">
                  <LayoutGrid className="size-3.5" aria-hidden />
                  {tm("courts")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
