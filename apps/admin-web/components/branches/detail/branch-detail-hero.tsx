"use client";

import { Button, cn } from "@bokdy/ui";
import {
  ArrowLeft,
  Clock,
  LayoutGrid,
  MapPin,
  Pencil,
  Trophy,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { BranchFormSheet } from "@/components/branches/branch-form-sheet";
import { BRANCH_STATUS_TONE } from "@/components/branches/branch-status";
import { BranchSportsChips } from "@/components/branches/branch-sports-chips";
import { useAdminUnitPlace } from "@/components/branches/detail/use-branch-place";
import { softDirectoryPrimaryBtn } from "@/components/data-list";
import { EntityAvatar } from "@/components/entity/avatar";
import { EntityStatusBadge } from "@/components/entity/status-badge";
import { usePageShellLeading } from "@/components/shell/shell-title";
import { useBranchSchedule } from "@/hooks/use-branch-schedule";
import { useSports } from "@/hooks/use-sports";
import { Link } from "@/i18n/navigation";
import { branchShortIntro, currentBranchAddress } from "@/lib/api/branches";
import type { BusinessHour } from "@/lib/api/branch-schedule";

import { useBranchDetail } from "./branch-detail-context";

function todayWeekdayInSaigon(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
  }).formatToParts(new Date());
  const wd = parts.find((p) => p.type === "weekday")?.value;
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[wd ?? ""] ?? new Date().getDay();
}

function todayHoursLabel(
  days: BusinessHour[] | undefined,
  openToday: (range: string) => string,
  closedToday: string,
): string | null {
  if (!days?.length) return null;
  const weekday = todayWeekdayInSaigon();
  const day = days.find((d) => d.weekday === weekday);
  if (!day) return null;
  if (day.is_closed) return closedToday;
  if (day.opens_at && day.closes_at) {
    return openToday(`${day.opens_at} – ${day.closes_at}`);
  }
  return closedToday;
}

/** Overview profile card: cover, overlapping avatar, intro, address/hours, KPIs. */
export function BranchDetailHero() {
  const tb = useTranslations("organization.branch");
  const th = useTranslations("organization.branchDetail.hero");
  const ts = useTranslations("shell");
  const locale = useLocale();
  const { branch, organizationId, branchId } = useBranchDetail();
  const [editing, setEditing] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setBannerFailed(false);
  }, [branch.banner_file_id]);
  useEffect(() => {
    setLogoFailed(false);
  }, [branch.logo_file_id]);

  const address = currentBranchAddress(branch);
  const place = useAdminUnitPlace(address?.province_id, address?.ward_id);
  const { data: schedule } = useBranchSchedule(organizationId, branchId);
  const { data: sports = [] } = useSports();
  const sportIds = branch.sport_ids ?? [];

  const back = usePageShellLeading(
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="size-9 rounded-full text-muted-foreground hover:bg-muted/70"
    >
      <Link
        href={`/organizations/${organizationId}/branches`}
        aria-label={ts("menuBack")}

      >
        <ArrowLeft className="size-4" />
      </Link>
    </Button>,
  );

  const logoSrc =
    branch.logo_file_id && !logoFailed
      ? `/api/go/files/${branch.logo_file_id}`
      : null;
  const bannerSrc =
    branch.banner_file_id && !bannerFailed
      ? `/api/go/files/${branch.banner_file_id}`
      : null;
  const shortIntro = branchShortIntro(branch, locale);
  const hoursLabel = todayHoursLabel(
    schedule,
    (range) => th("openToday", { range }),
    th("closedToday"),
  );

  const addressLine = [address?.address_line_1?.trim(), place]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      {back}
      <div className="px-4 pt-3 md:px-5 md:pt-4">
        <div className="soft-elevated overflow-hidden rounded-3xl border-0">
          {/* Banner crop is 3:1 (1200×400) — keep display aspect in sync */}
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
            {/* Identity: avatar + title + CTA on one row */}
            <div className="-mt-10 mb-2 flex items-end gap-3 md:-mt-12 md:gap-4">
              <div className="relative size-30 shrink-0 overflow-hidden rounded-full border-2 border-card bg-card shadow-sm md:size-34">
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
                    name={branch.name}
                    size="lg"
                    className="size-full rounded-none"
                  />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-2 pb-0.5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                      {branch.name}
                    </h1>
                    <EntityStatusBadge
                      label={tb(`status.${branch.status}`)}
                      tone={BRANCH_STATUS_TONE[branch.status]}
                    />
                  </div>
                  <div className="mt-1.5">
                    {sportIds.length > 0 ? (
                      <BranchSportsChips
                        sports={sports}
                        sportIds={sportIds}
                        maxVisible={8}
                        aria-label={tb("fieldSports")}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {tb("emptyValue")}
                      </p>
                    )}
                  </div>
                </div>
                {branch.status === "archived" ? null : (
                  <Button
                    type="button"
                    size="lg"
                    className={cn(softDirectoryPrimaryBtn, "shrink-0")}
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="size-4" aria-hidden />
                    {tb("editProfile")}
                  </Button>
                )}
              </div>
            </div>

            {shortIntro ? (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-foreground/85">
                {shortIntro}
              </p>
            ) : null}

            {/* Footer: address/hours + KPIs */}
            <div className="mt-3 flex flex-col gap-2.5 border-t border-border/40 pt-2.5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 space-y-1 text-sm text-muted-foreground">
                {addressLine ? (
                  <p className="flex items-start gap-2">
                    <MapPin
                      className="mt-0.5 size-4 shrink-0 text-sky-600"
                      aria-hidden
                    />
                    <span className="text-foreground/80">{addressLine}</span>
                  </p>
                ) : null}
                {hoursLabel ? (
                  <p className="flex items-start gap-2">
                    <Clock
                      className="mt-0.5 size-4 shrink-0 text-sky-600"
                      aria-hidden
                    />
                    <span className="text-foreground/80">{hoursLabel}</span>
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 gap-5 sm:gap-6">
                <div className="text-center sm:text-right">
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {branch.court_count ?? 0}
                  </p>
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground sm:justify-end">
                    <LayoutGrid className="size-3.5" aria-hidden />
                    {th("courtCount")}
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {sportIds.length}
                  </p>
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground sm:justify-end">
                    <Trophy className="size-3.5" aria-hidden />
                    {th("sportCount")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BranchFormSheet
        open={editing}
        mode="edit"
        organizationId={organizationId}
        branch={branch}
        onOpenChange={(open) => {
          if (!open) setEditing(false);
        }}
      />
    </>
  );
}
