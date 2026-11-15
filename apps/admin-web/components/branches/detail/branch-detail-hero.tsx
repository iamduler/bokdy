"use client";

import { Button, cn, formatUserTime } from "@bokdy/ui";
import { Clock, LayoutGrid, MapPin, Pencil, Trophy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { BranchFormSheet } from "@/components/branches/branch-form-sheet";
import { BRANCH_STATUS_TONE } from "@/components/branches/branch-status";
import { BranchSportsChips } from "@/components/branches/branch-sports-chips";
import { useAdminUnitPlace } from "@/components/branches/detail/use-branch-place";
import { softDirectoryPrimaryBtn } from "@/components/data-list";
import {
  EntityDetailHero,
  EntityDetailHeroKpi,
  EntityDetailHeroMeta,
} from "@/components/entity/detail-hero";
import { EntityStatusBadge } from "@/components/entity/status-badge";
import { useBranchSchedule } from "@/hooks/use-branch-schedule";
import { useSports } from "@/hooks/use-sports";
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
    return openToday(`${formatUserTime(day.opens_at)} – ${formatUserTime(day.closes_at)}`);
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

  const logoSrc = branch.logo_file_id && !logoFailed ? `/api/go/files/${branch.logo_file_id}` : null;
  const bannerSrc =
    branch.banner_file_id && !bannerFailed ? `/api/go/files/${branch.banner_file_id}` : null;
  const shortIntro = branchShortIntro(branch, locale);
  const hoursLabel = todayHoursLabel(
    schedule,
    (range) => th("openToday", { range }),
    th("closedToday"),
  );
  const addressLine = [address?.address_line_1?.trim(), place].filter(Boolean).join(", ");

  return (
    <>
      <EntityDetailHero
        backHref={`/organizations/${organizationId}/branches`}
        backLabel={ts("menuBack")}
        name={branch.name}
        bannerSrc={bannerSrc}
        logoSrc={logoSrc}
        onBannerError={() => setBannerFailed(true)}
        onLogoError={() => setLogoFailed(true)}
        avatarClassName="size-30 md:size-34"
        badges={
          <EntityStatusBadge
            label={tb(`status.${branch.status}`)}
            tone={BRANCH_STATUS_TONE[branch.status]}
          />
        }
        subtitle={
          sportIds.length > 0 ? (
            <BranchSportsChips
              sports={sports}
              sportIds={sportIds}
              maxVisible={8}
              aria-label={tb("fieldSports")}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{tb("emptyValue")}</p>
          )
        }
        edit={
          branch.status === "archived" ? null : (
            <Button
              type="button"
              size="lg"
              className={cn(softDirectoryPrimaryBtn, "shrink-0")}
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-4" aria-hidden />
              {tb("editProfile")}
            </Button>
          )
        }
        intro={
          shortIntro ? (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-foreground/85">{shortIntro}</p>
          ) : null
        }
        meta={
          <>
            {addressLine ? (
              <EntityDetailHeroMeta icon={<MapPin className="size-4 shrink-0" aria-hidden />}>
                {addressLine}
              </EntityDetailHeroMeta>
            ) : null}
            {hoursLabel ? (
              <EntityDetailHeroMeta icon={<Clock className="size-4 shrink-0" aria-hidden />}>
                {hoursLabel}
              </EntityDetailHeroMeta>
            ) : null}
          </>
        }
        kpis={
          <>
            <EntityDetailHeroKpi
              value={branch.court_count ?? 0}
              label={th("courtCount")}
              icon={<LayoutGrid className="size-3.5" aria-hidden />}
            />
            <EntityDetailHeroKpi
              value={sportIds.length}
              label={th("sportCount")}
              icon={<Trophy className="size-3.5" aria-hidden />}
            />
          </>
        }
      />
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
