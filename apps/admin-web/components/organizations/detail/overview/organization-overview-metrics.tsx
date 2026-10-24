"use client";

import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import { DataListStats } from "@/components/data-list";

import { useOrganizationDetail } from "../organization-detail-context";

export function OrganizationOverviewMetrics() {
  const t = useTranslations("organization.detailMetrics");
  const { org } = useOrganizationDetail();

  return (
    <div className="shrink-0 px-5 pb-1 md:px-6">
      <DataListStats
        className="grid-cols-1 sm:max-w-xs md:grid-cols-1"
        items={[
          {
            key: "branches",
            label: t("branches"),
            value: org.branch_count ?? 0,
            icon: <MapPin className="size-4" aria-hidden />,
            iconTone: "sky",
          },
        ]}
      />
    </div>
  );
}
