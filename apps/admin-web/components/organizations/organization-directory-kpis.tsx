"use client";

import { cn } from "@bokdy/ui";
import { Building2, CircleCheck, CirclePause, CircleSlash } from "lucide-react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

import type { OrganizationDirectoryStats } from "./organization-directory-stats";

const KPI_ITEMS = [
  { key: "total", icon: Building2, tone: "text-primary" },
  { key: "active", icon: CircleCheck, tone: "text-emerald-600 dark:text-emerald-400" },
  { key: "inactive", icon: CirclePause, tone: "text-amber-600 dark:text-amber-400" },
  { key: "suspended", icon: CircleSlash, tone: "text-destructive" },
] as const satisfies ReadonlyArray<{
  key: keyof Pick<OrganizationDirectoryStats, "total" | "active" | "inactive" | "suspended">;
  icon: LucideIcon;
  tone: string;
}>;

type OrganizationDirectoryKpisProps = {
  stats: OrganizationDirectoryStats;
  isLoading?: boolean;
};

export function OrganizationDirectoryKpis({ stats, isLoading }: OrganizationDirectoryKpisProps) {
  const t = useTranslations("organization");

  return (
    <div className="grid shrink-0 grid-cols-2 gap-2.5 px-4 py-3 md:grid-cols-4 md:px-6">
      {KPI_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.key}
            className="rounded-[10px] border border-border bg-card/50 px-3.5 py-2.5"
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <Icon className={cn("h-[18px] w-[18px]", item.tone)} aria-hidden />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t(`directoryKpis.${item.key}`)}
              </span>
            </div>
            <div className={cn("text-[28px] font-extrabold leading-none tracking-tight", item.tone)}>
              {isLoading ? "—" : stats[item.key]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
