"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";

import { DataListEmpty } from "@/components/data-list";
import { EntityUnavailableButton } from "@/components/entity/unavailable";

import { OrganizationDetailScreenHeader } from "../organization-detail-screen-header";
import { useOrganizationDetail } from "../organization-detail-context";

export function OrganizationActivityView() {
  const t = useTranslations("organization.detailActivity");
  const tu = useTranslations("organization");
  const { org } = useOrganizationDetail();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <OrganizationDetailScreenHeader
        title={t("title", { name: org.name })}
        actions={
          <EntityUnavailableButton reason={tu("unavailable")} className="gap-1">
            <Download className="h-3.5 w-3.5" />
            {t("export")}
          </EntityUnavailableButton>
        }
      />
      <DataListEmpty title={t("empty")} description={t("emptyHint")} />
    </div>
  );
}
