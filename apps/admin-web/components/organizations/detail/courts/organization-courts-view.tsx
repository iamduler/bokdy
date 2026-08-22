"use client";

import { Badge, Button, cn, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { Home, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { OrganizationDetailScreenHeader } from "../organization-detail-screen-header";
import { useOrganizationDetail } from "../organization-detail-context";
import { DetailHealthBar } from "../shared/detail-health-bar";
import { DetailSectionHead } from "../shared/detail-section-head";
import { DETAIL_MOCK } from "../shared/detail-mock-data";

function UnavailableButton({ label }: { label: string }) {
  const t = useTranslations("organization");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" disabled>
            {label}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{t("unavailable")}</TooltipContent>
    </Tooltip>
  );
}

export function OrganizationCourtsView() {
  const t = useTranslations("organization.detailCourts");
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
            <UnavailableButton label={t("export")} />
          </>
        }
      />

      <div className="flex-1 overflow-y-auto soft-scrollbar p-4 md:px-6 md:pb-6">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c) => {
            const maintVariant =
              c.maintenance === "ok"
                ? "success"
                : c.maintenance === "scheduled"
                  ? "warning"
                  : "danger";
            return (
              <div
                key={c.name}
                className={cn(
                  "relative overflow-hidden rounded-[13px] border bg-card/40 p-3.5",
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
                  <p className="text-[15px] font-extrabold text-foreground">{c.name}</p>
                  <Badge variant={maintVariant} className="text-[10px]">
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
                      <DetailSectionHead>{label}</DetailSectionHead>
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
                <DetailSectionHead>
                  {t("usageMeta", { rate: c.bookingRate })}
                </DetailSectionHead>
                <DetailHealthBar score={c.occupancy} size="sm" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
