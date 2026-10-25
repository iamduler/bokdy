"use client";

import { RichTextView } from "@bokdy/ui";
import { FileText, Link2, Mail, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { useBranchDetail } from "@/components/branches/detail/branch-detail-context";
import { BranchDetailHero } from "@/components/branches/detail/branch-detail-hero";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { MapPicker } from "@/components/maps/map-picker";
import { useDistricts, useProvinces, useWards } from "@/hooks/use-admin-units";
import {
  branchDescription,
  currentBranchAddress,
  formerBranchAddress,
} from "@/lib/api/branches";

/** Branch Overview: compact hero + map/contact grid + address panels. */
export function BranchOverviewView() {
  const { branch } = useBranchDetail();
  const t = useTranslations("organization");
  const tb = useTranslations("organization.branch");
  const locale = useLocale();
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

  const contactPanel = (
    <EntityDetailPanel
      title={tb("contact")}
      icon={<Mail className="size-4" aria-hidden />}
      tone="sky"
      className="p-4"
    >
      <ProfileRow label={t("fieldEmail")} value={branch.email || empty} />
      <ProfileRow label={t("fieldPhone")} value={branch.phone || empty} />
    </EntityDetailPanel>
  );

  const linksPanel = (
    <EntityDetailPanel
      title={tb("links")}
      icon={<Link2 className="size-4" aria-hidden />}
      tone="rose"
      className="p-4"
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
    <div className="flex flex-col">
      <BranchDetailHero />
      <div className="flex flex-col gap-3 p-4 md:px-5">
        <EntityDetailPanel
          title={tb("fieldDescription")}
          icon={<FileText className="size-4" aria-hidden />}
          tone="amber"
          className="p-4"
        >
          {description ? (
            <RichTextView html={description} />
          ) : (
            <p className="text-sm text-muted-foreground">{empty}</p>
          )}
        </EntityDetailPanel>

        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2">
          <EntityDetailPanel
            title={tb("map")}
            icon={<MapPin className="size-4" aria-hidden />}
            tone="sky"
            className="flex min-h-40 flex-col p-4 lg:h-full lg:min-h-0"
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

          <div className="flex h-full flex-col gap-3">
            {contactPanel}
            {linksPanel}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <EntityDetailPanel
            title={tb("addressCurrent")}
            icon={<MapPin className="size-4" aria-hidden />}
            tone="amber"
            className="p-4"
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
            icon={<MapPin className="size-4" aria-hidden />}
            tone="rose"
            className="p-4"
          >
            <ProfileRow
              label={t("fieldProvince")}
              value={formerProvinceName || empty}
            />
            <ProfileRow
              label={tb("fieldDistrict")}
              value={formerDistrictName || empty}
            />
            <ProfileRow
              label={t("fieldWard")}
              value={formerWardName || empty}
            />
            <ProfileRow
              label={t("fieldAddress1")}
              value={former?.address_line_1 || empty}
            />
          </EntityDetailPanel>
        </div>
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
      className="break-all text-sky-700 hover:underline dark:text-sky-300"
    >
      {trimmed}
    </a>
  );
}

function ProfileRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/40 py-1.5 last:border-0">
      <span className="w-28 shrink-0 text-xs text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-sm text-foreground">{value}</span>
    </div>
  );
}
