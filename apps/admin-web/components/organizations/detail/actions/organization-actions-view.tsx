"use client";

import { useTranslations } from "next-intl";

import { OrganizationSectionFrame } from "@/components/organizations/detail/organization-section-frame";

import { OrganizationActionsList } from "./organization-actions-list";

export function OrganizationActionsView() {
  const t = useTranslations("organization.detailActions");

  return (
    <OrganizationSectionFrame title={t("pageTitle")}>
      <div className="mx-auto max-w-3xl">
        <OrganizationActionsList />
      </div>
    </OrganizationSectionFrame>
  );
}
