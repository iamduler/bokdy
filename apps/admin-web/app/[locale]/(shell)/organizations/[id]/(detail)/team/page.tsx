"use client";

import { useTranslations } from "next-intl";

import { OrganizationTeamView } from "@/components/organizations/detail/team/organization-team-view";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function OrganizationTeamPage() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.organizationDetail"));

  return <OrganizationTeamView />;
}
