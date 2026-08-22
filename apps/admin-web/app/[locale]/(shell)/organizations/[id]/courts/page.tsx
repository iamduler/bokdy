"use client";

import { useTranslations } from "next-intl";

import { OrganizationCourtsView } from "@/components/organizations/detail/courts/organization-courts-view";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function OrganizationCourtsPage() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.organizationDetail"));

  return <OrganizationCourtsView />;
}
