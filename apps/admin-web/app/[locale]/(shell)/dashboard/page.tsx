"use client";

import { cn } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { softContentMaxW } from "@/components/data-list";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function DashboardPage() {
  const t = useTranslations("shell");
  usePageShellTitle(t("pageTitles.dashboard"));

  return (
    <main className={cn("mx-auto w-full p-4 md:p-8", softContentMaxW)}>
      <h1 className="text-2xl font-semibold tracking-tight">{t("welcome")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
    </main>
  );
}
