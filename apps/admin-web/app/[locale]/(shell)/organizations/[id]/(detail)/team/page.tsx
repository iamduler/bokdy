"use client";

import { useTranslations } from "next-intl";

import { usePageShellTitle } from "@/components/shell/shell-title";
import { TeamView } from "@/components/team/team-view";

export default function OrganizationTeamPage() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.organizationDetail"));

  return <TeamView />;
}
