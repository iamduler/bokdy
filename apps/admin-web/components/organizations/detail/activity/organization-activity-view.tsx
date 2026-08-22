"use client";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { OrganizationDetailScreenHeader } from "../organization-detail-screen-header";
import { useOrganizationDetail } from "../organization-detail-context";
import { DETAIL_MOCK } from "../shared/detail-mock-data";

const CAT_ICONS: Record<string, string> = {
  operation: "📅",
  revenue: "💰",
  staff: "👤",
  verification: "✅",
};

export function OrganizationActivityView() {
  const t = useTranslations("organization.detailActivity");
  const tu = useTranslations("organization");
  const { org } = useOrganizationDetail();
  const [filterCat, setFilterCat] = useState("");

  const categories = [...new Set(DETAIL_MOCK.activityEvents.map((e) => e.cat))];
  const filtered = DETAIL_MOCK.activityEvents.filter((e) => !filterCat || e.cat === filterCat);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <OrganizationDetailScreenHeader
        title={t("title", { name: org.name })}
        actions={
          <>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs"
              aria-label={t("filterCategory")}
            >
              <option value="">{t("allCategories")}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {t(`categories.${c}`)}
                </option>
              ))}
            </select>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled>
                    <Download className="h-3.5 w-3.5" />
                    {t("export")}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{tu("unavailable")}</TooltipContent>
            </Tooltip>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto soft-scrollbar p-5 md:px-6">
        <div className="relative max-w-[680px]">
          <div className="absolute top-0 bottom-0 left-[15px] w-px bg-border" />
          {filtered.map((e) => (
            <div key={e.labelKey} className="mb-3 flex gap-3.5">
              <div className="z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm">
                {CAT_ICONS[e.cat] ?? "•"}
              </div>
              <div className="flex-1 rounded-xl border border-border bg-card/40 px-4 py-3">
                <div className="mb-1 flex items-start justify-between gap-3">
                  <p className="text-[13.5px] font-bold text-foreground">
                    {t(`events.${e.labelKey}`)}
                  </p>
                  <span className="shrink-0 text-[11px] whitespace-nowrap text-muted-foreground">
                    {e.time}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{t(`events.${e.detailKey}`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
