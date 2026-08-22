"use client";

import { useTranslations } from "next-intl";

import { OrganizationActivityView } from "@/components/organizations/detail/activity/organization-activity-view";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function OrganizationActivityPage() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.organizationDetail"));

  return <OrganizationActivityView />;
}
