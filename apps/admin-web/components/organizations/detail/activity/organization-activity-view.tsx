"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";

import { DataListEmpty } from "@/components/data-list";
import { EntityUnavailableButton } from "@/components/entity/unavailable";
import { OrganizationSectionFrame } from "@/components/organizations/detail/organization-section-frame";

export function OrganizationActivityView() {
  const t = useTranslations("organization.detailActivity");
  const tu = useTranslations("organization");

  return (
    <OrganizationSectionFrame
      title={t("title")}
      actions={
        <EntityUnavailableButton reason={tu("unavailable")} className="gap-1">
          <Download className="h-3.5 w-3.5" />
          {t("export")}
        </EntityUnavailableButton>
      }
    >
      <DataListEmpty title={t("empty")} description={t("emptyHint")} />
    </OrganizationSectionFrame>
  );
}
