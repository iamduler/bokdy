"use client";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import type { OrganizationDirectoryStats } from "./organization-directory-stats";

type OrganizationDirectoryHeaderProps = {
  stats: OrganizationDirectoryStats;
  isLoading?: boolean;
  onOpenCreate: () => void;
};

export function OrganizationDirectoryHeader({
  stats,
  isLoading,
  onOpenCreate,
}: OrganizationDirectoryHeaderProps) {
  const t = useTranslations("organization");

  return (
    <div className="flex shrink-0 flex-col gap-3 px-4 pt-4 md:flex-row md:items-start md:px-6 md:pt-5">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-black tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-0.5 text-xs text-muted-foreground md:text-[13px]">
          {isLoading
            ? "—"
            : t("directorySubtitle", {
                orgCount: stats.total,
                branchCount: stats.branchTotal,
              })}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">{t("statsFootnote")}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button type="button" variant="outline" size="sm" className="h-9" disabled>
                {t("directoryExport")}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("directoryExportUnavailable")}</TooltipContent>
        </Tooltip>
        <Button type="button" size="sm" className="h-9" onClick={onOpenCreate}>
          + {t("create")}
        </Button>
      </div>
    </div>
  );
}
