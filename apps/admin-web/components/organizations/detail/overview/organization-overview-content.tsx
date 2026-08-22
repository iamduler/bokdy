"use client";

import { Button, cn } from "@bokdy/ui";
import { AlertTriangle, Bot, MapPin, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { useOrganizationDetail } from "../organization-detail-context";
import { DetailHealthBar } from "../shared/detail-health-bar";
import { DetailPanel } from "../shared/detail-panel";
import { DetailSectionHead } from "../shared/detail-section-head";
import { DETAIL_MOCK } from "../shared/detail-mock-data";

export function OrganizationOverviewContent() {
  const t = useTranslations("organization.detailOverview");
  const { orgId } = useOrganizationDetail();

  const maxRevenue = Math.max(...DETAIL_MOCK.revenueTrend);

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex flex-col gap-3.5 overflow-y-auto soft-scrollbar p-5 md:px-6">
        <DetailPanel>
          <DetailSectionHead>{t("revenueTrend")}</DetailSectionHead>
          <div className="flex h-[60px] items-end gap-1">
            {DETAIL_MOCK.revenueTrend.map((v, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-t",
                  i === DETAIL_MOCK.revenueTrend.length - 1 ? "bg-primary" : "bg-primary/25",
                )}
                style={{ height: `${(v / maxRevenue) * 100}%` }}
                title={`${v}`}
              />
            ))}
          </div>
          <div className="mt-1.5 flex gap-1">
            {DETAIL_MOCK.revenueMonths.map((m) => (
              <div key={m} className="flex-1 text-center text-[10.5px] text-muted-foreground">
                {m}
              </div>
            ))}
          </div>
        </DetailPanel>

        <DetailPanel>
          <div className="mb-3 flex items-center justify-between gap-2">
            <DetailSectionHead>{t("topBranches")}</DetailSectionHead>
            <Link
              href={`/organizations/${orgId}/branches`}
              className="text-xs font-bold text-primary hover:underline"
            >
              {t("viewAll")}
            </Link>
          </div>
          {DETAIL_MOCK.topBranches.map((b, i) => (
            <div
              key={b.name}
              className={cn(
                "flex items-center gap-3.5 py-2.5",
                i < DETAIL_MOCK.topBranches.length - 1 && "border-b border-border/60",
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-foreground">{b.name}</p>
                <p className="text-[11.5px] text-muted-foreground">
                  {t("branchMeta", { courts: b.courts, occupancy: b.occupancy })}
                </p>
              </div>
              <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
                {b.revenue}
              </span>
            </div>
          ))}
        </DetailPanel>

        <DetailPanel>
          <DetailSectionHead>{t("healthBreakdown")}</DetailSectionHead>
          {DETAIL_MOCK.healthBreakdown.map((s) => {
            const colorClass =
              s.score >= 80
                ? "text-emerald-600 dark:text-emerald-400"
                : s.score >= 60
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-destructive";
            return (
              <div key={s.labelKey} className="mb-2.5 last:mb-0">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">{t(`health.${s.labelKey}`)}</span>
                  <span className={cn("font-bold", colorClass)}>{s.score}</span>
                </div>
                <div className="h-1 rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      s.score >= 80
                        ? "bg-emerald-500"
                        : s.score >= 60
                          ? "bg-amber-500"
                          : "bg-destructive",
                    )}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </DetailPanel>
      </div>

      <div className="flex flex-col gap-3.5 overflow-y-auto soft-scrollbar border-border p-4 lg:border-l md:p-5">
        <div className="overflow-hidden rounded-xl border border-primary/15 bg-card/40">
          <div className="flex items-center gap-2 border-b border-border bg-primary/10 px-3.5 py-2.5">
            <Bot className="h-4 w-4 text-primary" aria-hidden />
            <span className="text-xs font-bold text-primary">{t("aiSummary")}</span>
          </div>
          <div className="flex flex-col gap-2.5 p-3.5">
            {DETAIL_MOCK.aiInsights.map((key) => (
              <p
                key={key}
                className="rounded-lg border-l-2 border-primary bg-muted/30 px-2.5 py-2 text-xs leading-relaxed text-muted-foreground"
              >
                {t(`insights.${key}`)}
              </p>
            ))}
          </div>
        </div>

        <DetailPanel title={t("pendingTasks")}>
          {DETAIL_MOCK.tasks.map((task) => {
            const dotClass =
              task.priority === "high"
                ? "bg-destructive"
                : task.priority === "medium"
                  ? "bg-amber-500"
                  : "bg-muted-foreground";
            return (
              <div
                key={task.labelKey}
                className="flex items-start gap-2.5 border-b border-border/60 py-2 last:border-0"
              >
                <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", dotClass)} />
                <p className="min-w-0 flex-1 text-xs text-muted-foreground">
                  {t(`tasks.${task.labelKey}`)}
                </p>
                <span className="shrink-0 text-[11px] text-muted-foreground">{task.due}</span>
              </div>
            );
          })}
        </DetailPanel>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            {t("riskAlerts")}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{t(`alerts.${DETAIL_MOCK.riskAlert}`)}</p>
        </div>

        <Button asChild className="w-full gap-1.5">
          <Link href={`/organizations/${orgId}/actions`}>
            <Zap className="h-3.5 w-3.5" />
            {t("viewAllActions")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
