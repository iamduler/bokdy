"use client";

import { Button, cn, formatUserDateTime, Tooltip, TooltipContent, TooltipTrigger, useUserDateTimePrefs, type UserDateTimePrefs } from "@bokdy/ui";
import { ArrowLeft, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { EntityAvatar, entityFileSrc } from "@/components/entity/avatar";
import { EntityCoverSplit } from "@/components/entity/cover-split";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { OrganizationArchiveButton } from "@/components/organizations/organization-archive-button";
import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import { usePageShellLeading } from "@/components/shell/shell-title";
import { useProvinces } from "@/hooks/use-admin-units";
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

function padCount(value: number): string {
  if (value < 100) return String(value).padStart(2, "0");
  return String(value);
}

function foundedYear(createdAt: string | undefined, prefs: UserDateTimePrefs): string {
  if (!createdAt) return "";
  const date = formatUserDateTime(createdAt, prefs).split(" ")[0] ?? "";
  if (prefs.dateFormat === "ymd" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date.slice(0, 4);
  if (/^\d{2}-\d{2}-\d{4}$/.test(date)) return date.slice(-4);
  return /^(\d{4})/.exec(createdAt)?.[1] ?? "";
}

/** Identity card and banner for the organization overview. */
export function OrganizationOverviewHeader() {
  const t = useTranslations("organization");
  const tm = useTranslations("organization.detailMetrics");
  const tShell = useTranslations("shell");
  const prefs = useUserDateTimePrefs();
  const { org } = useOrganizationDetail();
  const [editing, setEditing] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);

  usePageShellLeading(
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

  useEffect(() => {
    setBannerFailed(false);
  }, [org.banner_file_id]);

  const provinceId = org.headquarters?.province_id;
  const { data: provinces = [] } = useProvinces("current_v2");
  const provinceName = provinces.find((unit) => unit.id === provinceId)?.name;
  const orgType = ORGANIZATION_TYPES.has(org.organization_type as OrganizationType)
    ? (org.organization_type as OrganizationType)
    : null;
  const bannerSrc = org.banner_file_id && !bannerFailed ? entityFileSrc(org.banner_file_id) : undefined;
  const subtitle = [org.primary_sport, provinceName].filter(Boolean).join(" · ");
  const year = foundedYear(org.created_at, prefs);

  return (
    <>
      <EntityCoverSplit
        mediaClassName={
          !bannerSrc
            ? "bg-linear-to-br from-sky-500/20 via-sky-500/5 to-muted bg-[radial-gradient(ellipse_at_30%_20%,rgba(56,189,248,0.18),transparent_55%)]"
            : undefined
        }
        media={
          bannerSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerSrc}
              alt=""
              className="absolute inset-0 size-full object-cover"
              onError={() => setBannerFailed(true)}
            />
          ) : null
        }
      >
        <div className="flex items-start gap-3 pr-20">
          <EntityAvatar
            name={org.name}
            src={entityFileSrc(org.logo_file_id)}
            className="size-12"
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {org.name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <OrganizationStatusBadge kind="org" status={org.status} />
              {orgType ? <SoftStatusChip label={t(`type.${orgType}`)} tone="muted" /> : null}
            </div>
            {subtitle ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <OrganizationArchiveButton orgId={org.id} name={org.name} status={org.status} />
          {org.status === "archived" ? null : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon-sm"
                  aria-label={t("detailOverview.editProfile")}
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="size-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("detailOverview.editProfile")}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="mt-auto grid grid-cols-2 border-t border-border/60">
          <Metric value={padCount(org.branch_count ?? 0)} label={tm("branches")} edge="start" />
          <Metric value={padCount(org.court_count ?? 0)} label={tm("courts")} />
          <Metric value={padCount(org.staff_count ?? 0)} label={tm("staff")} edge="start" row="last" />
          <Metric value={year} label={tm("founded")} row="last" />
        </div>
      </EntityCoverSplit>
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

function Metric({
  value,
  label,
  edge = "next",
  row = "first",
}: {
  value: string;
  label: string;
  edge?: "start" | "next";
  row?: "first" | "last";
}) {
  return (
    <div
      className={cn(
        "py-1.5",
        edge === "start" ? "pr-4" : "border-l border-border/60 pl-4",
        row === "first" && "border-b border-border/60",
      )}
    >
      <p className="text-lg font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
