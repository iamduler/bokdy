"use client";

import { Mail, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { useProvinces, useWards } from "@/hooks/use-admin-units";

import { useOrganizationDetail } from "../organization-detail-context";

export function OrganizationOverviewContent() {
  const t = useTranslations("organization");
  const to = useTranslations("organization.detailOverview");
  const { org } = useOrganizationDetail();
  const provinceId = org.headquarters?.province_id;
  const wardId = org.headquarters?.ward_id;
  const { data: provinces = [] } = useProvinces("current_v2");
  const { data: wards = [] } = useWards({
    scheme: "current_v2",
    provinceId: provinceId || undefined,
  });
  const provinceName = provinces.find((unit) => unit.id === provinceId)?.name;
  const wardName = wards.find((unit) => unit.id === wardId)?.name;
  const empty = to("emptyValue");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto soft-scrollbar p-5 md:gap-5 md:px-6">
      {org.banner_file_id ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/go/files/${org.banner_file_id}`}
          alt=""
          className="aspect-[3/1] w-full rounded-2xl object-cover ring-1 ring-black/5"
        />
      ) : null}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <EntityDetailPanel
          title={to("contact")}
          icon={<Mail className="size-4" aria-hidden />}
          tone="sky"
        >
          <ProfileRow label={t("fieldEmail")} value={org.email || empty} />
          <ProfileRow label={t("fieldPhone")} value={org.phone || empty} />
          <ProfileRow label={t("fieldWebsite")} value={org.website || empty} />
        </EntityDetailPanel>
        <EntityDetailPanel
          title={to("headquarters")}
          icon={<MapPin className="size-4" aria-hidden />}
          tone="amber"
        >
          <ProfileRow
            label={t("fieldProvince")}
            value={provinceName || empty}
          />
          <ProfileRow label={t("fieldWard")} value={wardName || empty} />
          <ProfileRow
            label={t("fieldAddress1")}
            value={org.headquarters?.address_line_1 || empty}
          />
        </EntityDetailPanel>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 py-2.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-sm text-foreground">
        {value}
      </span>
    </div>
  );
}
