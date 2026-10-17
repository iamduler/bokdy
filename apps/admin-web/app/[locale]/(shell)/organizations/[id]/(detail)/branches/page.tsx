"use client";

import { useTranslations } from "next-intl";

import { OrganizationBranchesView } from "@/components/organizations/detail/branches/organization-branches-view";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function OrganizationBranchesPage() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.organizationDetail"));

  return <OrganizationBranchesView />;
}
