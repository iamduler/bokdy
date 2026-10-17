"use client";

import { useTranslations } from "next-intl";

import { OrganizationActionsView } from "@/components/organizations/detail/actions/organization-actions-view";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function OrganizationActionsPage() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.organizationDetail"));

  return <OrganizationActionsView />;
}
