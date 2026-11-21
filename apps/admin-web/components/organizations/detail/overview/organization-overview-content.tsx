"use client";

import { cn, RichTextView } from "@bokdy/ui";
import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { softDetailSectionGap } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { useProvinces, useWards } from "@/hooks/use-admin-units";

import { useOrganizationDetail } from "../organization-detail-context";

function websiteHref(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function websiteLabel(raw: string): string {
  return raw.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function localized(locale: string, vi?: string, en?: string): string {
  const primary = locale.startsWith("vi") ? vi : en;
  const fallback = locale.startsWith("vi") ? en : vi;
  return primary?.trim() || fallback?.trim() || "";
}

export function OrganizationOverviewContent() {
  const t = useTranslations("organization");
  const to = useTranslations("organization.detailOverview");
  const tTenant = useTranslations("organization.tenantStatus");
  const locale = useLocale();
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
  const address = [org.headquarters?.address_line_1, wardName, provinceName].filter(Boolean).join(", ");
  const intro = localized(locale, org.short_intro_vi, org.short_intro_en);
  const description = localized(locale, org.description_vi, org.description_en);
  const website = org.website?.trim();
  const email = org.email?.trim();
  const phone = org.phone?.trim();

  return (
    <div className={cn("grid grid-cols-1 items-start md:grid-cols-2", softDetailSectionGap)}>
      <section className="soft-elevated rounded-3xl p-3 md:p-6">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {to("about")}
        </p>
        {intro ? (
          <h2 className="mt-4 text-2xl font-semibold leading-snug text-foreground">{intro}</h2>
        ) : null}
        {description ? (
          <RichTextView html={description} className={cn("text-muted-foreground", intro && "mt-3")} />
        ) : null}
        <div className={cn("flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2", (intro || description) && "mt-4 md:mt-6")}>
          <ContactItem icon={<MapPin className="size-4 shrink-0" aria-hidden />} text={address || empty} />
          <ContactItem icon={<Mail className="size-4 shrink-0" aria-hidden />} text={email || empty} />
          <ContactItem icon={<Phone className="size-4 shrink-0" aria-hidden />} text={phone || empty} />
        </div>
      </section>
      <EntityDetailPanel
        title={to("profile")}
        icon={<Building2 className="size-4" aria-hidden />}
        tone="emerald"
        className="p-3 md:p-5"
      >
        <ProfileRow label={t("fieldLegalName")} value={org.legal_name || empty} />
        <ProfileRow label={t("fieldTaxCode")} value={org.tax_code || empty} />
        <ProfileRow
          label={t("fieldTenantStatus")}
          value={org.tenant_status ? tTenant(org.tenant_status) : empty}
        />
        <ProfileRow label={to("ownerLabel")} value={org.owner_display_name || empty} emphasize />
        <ProfileRow
          label={t("fieldWebsite")}
          value={
            website ? (
              <a
                href={websiteHref(website)}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-foreground"
              >
                {websiteLabel(website)}
              </a>
            ) : (
              empty
            )
          }
        />
      </EntityDetailPanel>
    </div>
  );
}

function ContactItem({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="inline-flex w-full min-w-0 items-center gap-1.5 sm:w-auto">
      {icon}
      <span className="min-w-0">{text}</span>
    </span>
  );
}

function ProfileRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border/40 py-2 last:border-0 md:gap-4 md:py-3">
      <span className="w-36 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className={cn("min-w-0 flex-1 text-sm text-foreground", emphasize && "font-medium")}>{value}</span>
    </div>
  );
}
