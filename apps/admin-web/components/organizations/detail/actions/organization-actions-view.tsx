"use client";

import { useTranslations } from "next-intl";

import { OrganizationDetailScreenHeader } from "../organization-detail-screen-header";
import { OrganizationActionsList } from "./organization-actions-list";

export function OrganizationActionsView() {
  const t = useTranslations("organization.detailActions");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <OrganizationDetailScreenHeader title={t("pageTitle")} />

      <div className="flex-1 overflow-y-auto soft-scrollbar p-4 md:px-6 md:pb-6">
        <div className="mx-auto max-w-3xl">
          <OrganizationActionsList />
        </div>
      </div>
    </div>
  );
}
