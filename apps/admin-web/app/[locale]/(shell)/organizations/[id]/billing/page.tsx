"use client";

import { useTranslations } from "next-intl";

import { OrganizationBillingView } from "@/components/organizations/detail/billing/organization-billing-view";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function OrganizationBillingPage() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.organizationDetail"));

  return <OrganizationBillingView />;
}
