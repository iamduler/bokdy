"use client";

import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import { useOrganizationDetail } from "../organization-detail-context";

export function OrganizationOverviewMetrics() {
  const t = useTranslations("organization.detailMetrics");
  const { org } = useOrganizationDetail();

  return (
    <div className="shrink-0 px-6 pb-1">
      <div className="inline-flex min-w-[108px] flex-col gap-0.5 rounded-md border border-border bg-card px-2.5 py-2">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <MapPin className="h-3 w-3 text-primary" aria-hidden />
          {t("branches")}
        </div>
        <p className="text-base font-bold text-primary">{org.branch_count ?? 0}</p>
      </div>
    </div>
  );
}
