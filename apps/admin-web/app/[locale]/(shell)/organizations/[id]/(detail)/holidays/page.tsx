"use client";

import { useTranslations } from "next-intl";

import { OrganizationHolidaysView } from "@/components/organizations/detail/holidays/organization-holidays-view";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function OrganizationHolidaysPage() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.organizationDetail"));

  return <OrganizationHolidaysView />;
}
