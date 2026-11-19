"use client";

import { useTranslations } from "next-intl";
import { useMemo, type ReactNode } from "react";

import { EntityDetailTabs, type EntityDetailTabItem } from "@/components/entity/detail-tabs";
import { usePageShellTitle } from "@/components/shell/shell-title";
import { usePathname } from "@/i18n/navigation";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("shell");
  const tSettings = useTranslations("settings");
  const pathname = usePathname();
  usePageShellTitle(t("pageTitles.settings"));

  const tabs = useMemo<EntityDetailTabItem[]>(
    () => [
      {
        id: "holidays",
        label: tSettings("tabs.holidays"),
        href: "/settings/holidays",
        active: pathname === "/settings" || pathname.startsWith("/settings/holidays"),
      },
    ],
    [pathname, tSettings],
  );

  return (
    <div className="page-canvas flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <EntityDetailTabs
        tabs={tabs}
        variant="pill"
        ariaLabel={tSettings("tabs.aria")}
        className="px-0 pb-0"
      />
      {children}
    </div>
  );
}
