"use client";

import { ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { DataListEmpty } from "@/components/data-list";
import { EntityUnavailableButton } from "@/components/entity/unavailable";
import { OrganizationSectionFrame } from "@/components/organizations/detail/organization-section-frame";

export function OrganizationBillingView() {
  const t = useTranslations("organization.detailBilling");
  const tu = useTranslations("organization");

  return (
    <OrganizationSectionFrame
      title={t("title")}
      actions={
        <>
          <EntityUnavailableButton label={t("viewInvoices")} reason={tu("unavailable")} />
          <EntityUnavailableButton reason={tu("unavailable")} variant="default" className="gap-1">
            <ArrowUp className="h-3.5 w-3.5" />
            {t("upgrade")}
          </EntityUnavailableButton>
        </>
      }
    >
      <DataListEmpty title={t("empty")} description={t("emptyHint")} />
    </OrganizationSectionFrame>
  );
}
