"use client";

import { cn } from "@bokdy/ui";
import { Building2, Mail, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { softDetailSectionGap } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import { useProvinces, useWards } from "@/hooks/use-admin-units";

import { useOrganizationDetail } from "../organization-detail-context";

function websiteHref(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function linkValue(url: string | undefined | null, empty: string): ReactNode {
  const trimmed = url?.trim();
  if (!trimmed) return empty;
  return (
    <a
      href={websiteHref(trimmed)}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-sky-700 dark:text-sky-300"
    >
      {trimmed}
    </a>
  );
}

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
    <>
      <EntityDetailPanel
        title={to("identity")}
        hint={to("identityHint")}
        icon={<Building2 className="size-4" aria-hidden />}
        tone="emerald"
      >
        <ProfileRow
          label={t("fieldLegalName")}
          value={org.legal_name || empty}
        />
        <ProfileRow label={t("fieldTaxCode")} value={org.tax_code || empty} />
        <ProfileRow
          label={t("fieldTenantStatus")}
          value={
            org.tenant_status ? (
              <OrganizationStatusBadge
                kind="tenant"
                status={org.tenant_status}
              />
            ) : (
              empty
            )
          }
        />
      </EntityDetailPanel>

      <div
        className={cn(
          "grid grid-cols-1 lg:grid-cols-2",
          softDetailSectionGap,
        )}
      >
        <EntityDetailPanel
          title={to("contact")}
          hint={to("contactHint")}
          icon={<Mail className="size-4" aria-hidden />}
          tone="sky"
        >
          <ProfileRow label={t("fieldEmail")} value={org.email || empty} />
          <ProfileRow label={t("fieldPhone")} value={org.phone || empty} />
          <ProfileRow
            label={t("fieldWebsite")}
            value={linkValue(org.website, empty)}
          />
        </EntityDetailPanel>
        <EntityDetailPanel
          title={to("headquarters")}
          hint={to("headquartersHint")}
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
    </>
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
