"use client";

import { useTranslations } from "next-intl";

import { OpsDashboard } from "@/components/dashboard/ops-dashboard";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function DashboardPage() {
  const t = useTranslations("shell");
  usePageShellTitle(t("pageTitles.dashboard"));

  return (
    <main className="mx-auto w-full p-4 md:p-6">
      <OpsDashboard />
    </main>
  );
}
