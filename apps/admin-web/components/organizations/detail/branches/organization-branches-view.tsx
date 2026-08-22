"use client";

import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { LayoutGrid, Map, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { OrganizationDetailScreenHeader } from "../organization-detail-screen-header";
import { useOrganizationDetail } from "../organization-detail-context";
import { DetailHealthBar } from "../shared/detail-health-bar";
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

export function OrganizationBranchesView() {
  const t = useTranslations("organization.detailBranches");
  const tu = useTranslations("organization");
  const { org } = useOrganizationDetail();
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <OrganizationDetailScreenHeader
        title={t("title", { name: org.name })}
        subtitle={t("subtitle", {
          branches: DETAIL_MOCK.branches.length,
          courts: DETAIL_MOCK.branches.reduce((a, b) => a + b.courts, 0),
        })}
        actions={
          <>
            <div className="flex gap-1">
              {(["grid", "map"] as const).map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  variant={viewMode === mode ? "default" : "outline"}
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => setViewMode(mode)}
                >
                  {mode === "grid" ? (
                    <LayoutGrid className="h-3.5 w-3.5" />
                  ) : (
                    <Map className="h-3.5 w-3.5" />
                  )}
                  {t(mode)}
                </Button>
              ))}
            </div>
            <UnavailableButton label={t("addBranch")} />
          </>
        }
      />

      <div className="flex-1 overflow-y-auto soft-scrollbar p-4 md:px-6 md:pb-6">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {DETAIL_MOCK.branches.map((b) => {
              const occTone =
                b.occupancy >= 75
                  ? "text-emerald-600 dark:text-emerald-400"
                  : b.occupancy >= 50
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-destructive";
              return (
                <div
                  key={b.name}
                  className="overflow-hidden rounded-xl border border-border bg-card/40"
                >
                  <div className="relative flex h-[100px] items-center justify-center bg-linear-to-br from-muted to-card">
                    <LayoutGrid className="h-10 w-10 text-muted-foreground/30" aria-hidden />
                    <span
                      className={cn(
                        "absolute top-2.5 right-2.5 rounded-md px-2 py-0.5 text-[11px] font-bold",
                        occTone,
                        "bg-background/80",
                      )}
                    >
                      {t("occupancy", { value: b.occupancy })}
                    </span>
                    {b.status === "maintenance" ? (
                      <span className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        <Wrench className="h-3 w-3" />
                        {t("maintenance")}
                      </span>
                    ) : null}
                  </div>
                  <div className="p-3.5">
                    <p className="mb-0.5 text-sm font-extrabold text-foreground">{b.name}</p>
                    <p className="mb-2.5 text-xs text-muted-foreground">
                      {b.manager} · {t("courtsCount", { count: b.courts })}
                    </p>
                    <div className="mb-2.5 flex items-center justify-between">
                      <DetailHealthBar score={b.occupancy} size="sm" />
                      <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
                        {b.revenue}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <UnavailableButton label={tu("view")} />
                      <UnavailableButton label={t("ownerApp")} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative h-[420px] overflow-hidden rounded-2xl border border-border bg-card/40">
            <div className="absolute inset-0 flex items-center justify-center bg-radial from-primary/5 to-transparent">
              <p className="max-w-xs text-center text-sm text-muted-foreground/60">{t("mapPlaceholder")}</p>
            </div>
            {DETAIL_MOCK.mapPins.map((pin) => {
              const color =
                pin.occupancy >= 75
                  ? "bg-emerald-500"
                  : pin.occupancy >= 50
                    ? "bg-amber-500"
                    : "bg-destructive";
              return (
                <div
                  key={pin.name}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 rotate-[-45deg] items-center justify-center rounded-full rounded-bl-none shadow-lg",
                      color,
                    )}
                  >
                    <span className="rotate-45 text-[10px] font-black text-white">{pin.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
