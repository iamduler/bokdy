"use client";

import { useTranslations } from "next-intl";

import { OrganizationOverviewPage } from "@/components/organizations/detail/overview/organization-overview-page";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function OrganizationDetailPage() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.organizationDetail"));

  return (
    <main className="flex min-h-0 w-full flex-1 flex-col">
      <OrganizationOverviewPage />
    </main>
  );
}
