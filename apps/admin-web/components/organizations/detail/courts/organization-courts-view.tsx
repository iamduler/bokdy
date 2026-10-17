"use client";

import { Badge, cn } from "@bokdy/ui";
import { Home, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { EntityHealthBar } from "@/components/entity/health-bar";
import { EntitySectionHead } from "@/components/entity/section-head";
import { EntityUnavailableButton } from "@/components/entity/unavailable";

import { OrganizationDetailScreenHeader } from "../organization-detail-screen-header";
import { useOrganizationDetail } from "../organization-detail-context";
import { DETAIL_MOCK } from "../shared/detail-mock-data";

export function OrganizationCourtsView() {
  const t = useTranslations("organization.detailCourts");
  const tu = useTranslations("organization");
  const { org } = useOrganizationDetail();
  const [filterSport, setFilterSport] = useState("");

  const sports = [...new Set(DETAIL_MOCK.courtPortfolio.map((c) => c.sport))];
  const filtered = DETAIL_MOCK.courtPortfolio.filter((c) => !filterSport || c.sport === filterSport);
  const urgentCount = DETAIL_MOCK.courtPortfolio.filter((c) => c.maintenance === "urgent").length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <OrganizationDetailScreenHeader
        title={t("title", { name: org.name })}
        subtitle={t("subtitle", { total: DETAIL_MOCK.courtPortfolio.length, urgent: urgentCount })}
        actions={
          <>
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs"
              aria-label={t("filterSport")}
            >
              <option value="">{t("allSports")}</option>
              {sports.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <EntityUnavailableButton label={t("export")} reason={tu("unavailable")} />
          </>
        }
      />

      <div className="flex-1 overflow-y-auto soft-scrollbar p-4 md:px-6 md:pb-6">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c) => {
            const maintClass =
              c.maintenance === "ok"
                ? "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : c.maintenance === "scheduled"
                  ? "border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-300"
                  : "border-transparent bg-destructive/15 text-destructive";
            return (
              <div
                key={c.name}
                className={cn(
                  "relative overflow-hidden rounded-md border bg-card/40 p-3.5",
                  c.maintenance === "urgent" ? "border-destructive/40" : "border-border",
                )}
              >
                <div
                  className={cn(
                    "absolute top-0 right-0 left-0 h-0.5",
                    c.occupancy >= 75
                      ? "bg-emerald-500"
                      : c.occupancy >= 50
                        ? "bg-amber-500"
                        : "bg-destructive",
                  )}
                />
                <div className="mb-2.5 flex items-start justify-between gap-2">
                  <p className="text-[15px] font-semibold text-foreground">{c.name}</p>
                  <Badge variant="outline" className={cn("text-[10px]", maintClass)}>
                    {t(`maintenance.${c.maintenance}`)}
                  </Badge>
                </div>
                <div className="mb-2.5 grid grid-cols-2 gap-1.5">
                  {[
                    [t("fieldSport"), c.sport],
                    [t("fieldSurface"), c.surface],
                    [t("fieldType"), c.indoor ? t("indoor") : t("outdoor")],
                    [t("fieldBranch"), c.branch],
                  ].map(([label, value]) => (
                    <div key={String(label)}>
                      <EntitySectionHead>{label}</EntitySectionHead>
                      <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                        {label === t("fieldType") ? (
                          c.indoor ? (
                            <Home className="h-3 w-3" />
                          ) : (
                            <Sun className="h-3 w-3" />
                          )
                        ) : null}
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                <EntitySectionHead>
                  {t("usageMeta", { rate: c.bookingRate })}
                </EntitySectionHead>
                <EntityHealthBar score={c.occupancy} size="sm" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
