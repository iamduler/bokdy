"use client";

import { cn, formatUserTime, RichTextView } from "@bokdy/ui";
import { FileText, Link2, Mail, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { useBranchDetail } from "@/components/branches/detail/branch-detail-context";
import { BranchAmenitiesView } from "@/components/branches/detail/branch-amenities-view";
import { BranchDetailHero } from "@/components/branches/detail/branch-detail-hero";
import { softDetailPanelPad } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { MapPicker } from "@/components/maps/map-picker";
import { useDistricts, useProvinces, useWards } from "@/hooks/use-admin-units";
import { useBranchSchedule } from "@/hooks/use-branch-schedule";
import {
  branchDescription,
  branchShortIntro,
  currentBranchAddress,
  formerBranchAddress,
} from "@/lib/api/branches";
import type { BusinessHour } from "@/lib/api/branch-schedule";

function todayWeekdayInSaigon(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
  }).formatToParts(new Date());
  const wd = parts.find((part) => part.type === "weekday")?.value;
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
  const day = days.find((item) => item.weekday === weekday);
  if (!day) return null;
  if (day.is_closed) return closedToday;
  if (day.opens_at && day.closes_at) {
    return openToday(`${formatUserTime(day.opens_at)} – ${formatUserTime(day.closes_at)}`);
  }
  return closedToday;
}

/** Branch Overview: Soft entity stack (hero + panels) — same layout as Org overview. */
export function BranchOverviewView() {
  const { branch, organizationId, branchId } = useBranchDetail();
  const t = useTranslations("organization");
  const tb = useTranslations("organization.branch");
  const th = useTranslations("organization.branchDetail.hero");
  const tTabs = useTranslations("organization.branchDetail.tabs");
  const locale = useLocale();
  const { data: schedule } = useBranchSchedule(organizationId, branchId);
  const address = currentBranchAddress(branch);
  const former = formerBranchAddress(branch);

  const { data: provinces = [] } = useProvinces("current_v2");
  const { data: wards = [] } = useWards({
    scheme: "current_v2",
    provinceId: address?.province_id || undefined,
  });
  const { data: formerProvinces = [] } = useProvinces("former_v3");
  const { data: formerDistricts = [] } = useDistricts(
    former?.province_former_id || undefined,
  );
  const { data: formerWards = [] } = useWards({
    scheme: "former_v3",
    districtId: former?.district_former_id || undefined,
  });

  const provinceName = provinces.find(
    (unit) => unit.id === address?.province_id,
  )?.name;
  const wardName = wards.find((unit) => unit.id === address?.ward_id)?.name;
  const formerProvinceName = formerProvinces.find(
    (unit) => unit.id === former?.province_former_id,
  )?.name;
  const formerDistrictName = formerDistricts.find(
    (unit) => unit.id === former?.district_former_id,
  )?.name;
  const formerWardName = formerWards.find(
    (unit) => unit.id === former?.ward_former_id,
  )?.name;

  const empty = tb("emptyValue");

  const lat = address?.latitude;
  const lng = address?.longitude;
  const hasCoords =
    lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);

  const description = branchDescription(branch, locale);
  const shortIntro = branchShortIntro(branch, locale);
  const hoursLabel = todayHoursLabel(
    schedule,
    (range) => th("openToday", { range }),
    th("closedToday"),
  );

  const contactPanel = (
    <EntityDetailPanel
      title={tb("contact")}
      hint={tb("hints.contact")}
      icon={<Mail className="size-4" aria-hidden />}
      tone="sky"
      className={softDetailPanelPad}
    >
      <ProfileRow label={t("fieldEmail")} value={branch.email || empty} />
      <ProfileRow label={t("fieldPhone")} value={branch.phone || empty} />
      <ProfileRow label={tTabs("schedule")} value={hoursLabel || empty} />
    </EntityDetailPanel>
  );

  const linksPanel = (
    <EntityDetailPanel
      title={tb("links")}
      hint={tb("hints.links")}
      icon={<Link2 className="size-4" aria-hidden />}
      tone="rose"
      className={softDetailPanelPad}
    >
      <ProfileRow
        label={tb("fieldWebsite")}
        value={linkValue(branch.website, empty)}
      />
      <ProfileRow
        label={tb("fieldFacebook")}
        value={linkValue(branch.facebook_url, empty)}
      />
      <ProfileRow
        label={tb("fieldGoogleMaps")}
        value={linkValue(branch.google_maps_url, empty)}
      />
      <ProfileRow
        label={tb("fieldFoundedYear")}
        value={
          branch.founded_year != null ? String(branch.founded_year) : empty
        }
      />
    </EntityDetailPanel>
  );

  return (
    <div
      className="flex w-full flex-col gap-3 px-0 pb-4 pt-0 md:gap-5 md:px-5 md:pb-6 md:pt-4"
    >
      <BranchDetailHero />

      <div className="grid grid-cols-1 items-stretch gap-3 md:gap-5 lg:grid-cols-2">
        <EntityDetailPanel
          title={tb("fieldDescription")}
          hint={tb("hints.description")}
          icon={<FileText className="size-4" aria-hidden />}
          tone="amber"
          className={cn("h-full", softDetailPanelPad)}
        >
          {shortIntro ? (
            <h2 className="text-2xl font-semibold leading-snug text-foreground">{shortIntro}</h2>
          ) : null}
          {description ? (
            <RichTextView html={description} className={shortIntro ? "mt-3 text-muted-foreground" : undefined} />
          ) : shortIntro ? null : (
            <p className="text-sm text-muted-foreground">{empty}</p>
          )}
        </EntityDetailPanel>
        <BranchAmenitiesView />
      </div>

      <div
        className="grid grid-cols-1 items-stretch gap-3 md:gap-5 lg:grid-cols-2"
      >
        <EntityDetailPanel
          title={tb("map")}
          hint={tb("hints.map")}
          icon={<MapPin className="size-4" aria-hidden />}
          tone="sky"
          className={cn("flex min-h-40 flex-col lg:h-full lg:min-h-0", softDetailPanelPad)}
        >
          {hasCoords ? (
            <div className="relative min-h-40 flex-1 overflow-hidden rounded-xl">
              <MapPicker
                latitude={lat}
                longitude={lng}
                readOnly
                unavailableLabel={tb("mapUnavailable")}
                className="absolute inset-0 size-full min-h-40 border-0"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{empty}</p>
          )}
        </EntityDetailPanel>

        <div className="flex h-full flex-col gap-3 md:gap-5">
          {contactPanel}
          {linksPanel}
        </div>
      </div>

      <div
        className="grid grid-cols-1 gap-3 md:gap-5 lg:grid-cols-2"
      >
        <EntityDetailPanel
          title={tb("addressCurrent")}
          hint={tb("hints.addressCurrent")}
          icon={<MapPin className="size-4" aria-hidden />}
          tone="amber"
          className={softDetailPanelPad}
        >
          <ProfileRow
            label={t("fieldProvince")}
            value={provinceName || empty}
          />
          <ProfileRow label={t("fieldWard")} value={wardName || empty} />
          <ProfileRow
            label={t("fieldAddress1")}
            value={address?.address_line_1 || empty}
          />
        </EntityDetailPanel>

        <EntityDetailPanel
          title={tb("addressFormer")}
          hint={tb("hints.addressFormer")}
          icon={<MapPin className="size-4" aria-hidden />}
          tone="rose"
          className={softDetailPanelPad}
        >
          <ProfileRow
            label={t("fieldProvince")}
            value={formerProvinceName || empty}
          />
          <ProfileRow
            label={tb("fieldDistrict")}
            value={formerDistrictName || empty}
          />
          <ProfileRow label={t("fieldWard")} value={formerWardName || empty} />
          <ProfileRow
            label={t("fieldAddress1")}
            value={former?.address_line_1 || empty}
          />
        </EntityDetailPanel>
      </div>
    </div>
  );
}

function linkValue(url: string | undefined | null, empty: string): ReactNode {
  const trimmed = url?.trim();
  if (!trimmed) return empty;
  return (
    <a
      href={trimmed}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-sky-700 dark:text-sky-300"
    >
      {trimmed}
    </a>
  );
}

function ProfileRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/40 py-1.5 last:border-0">
      <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 text-sm text-foreground">{value}</span>
    </div>
  );
}
