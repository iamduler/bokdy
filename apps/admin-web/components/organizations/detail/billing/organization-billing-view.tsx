"use client";

import { Badge, cn } from "@bokdy/ui";
import { ArrowUp, CreditCard, FileText, Gauge } from "lucide-react";
import { useTranslations } from "next-intl";

import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { EntitySectionHead } from "@/components/entity/section-head";
import { EntityUnavailableButton } from "@/components/entity/unavailable";

import { OrganizationDetailScreenHeader } from "../organization-detail-screen-header";
import { useOrganizationDetail } from "../organization-detail-context";
import { DETAIL_MOCK } from "../shared/detail-mock-data";

export function OrganizationBillingView() {
  const t = useTranslations("organization.detailBilling");
  const tu = useTranslations("organization");
  const { org } = useOrganizationDetail();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <OrganizationDetailScreenHeader
        title={t("title", { name: org.name })}
        actions={
          <>
            <EntityUnavailableButton label={t("viewInvoices")} reason={tu("unavailable")} className="gap-1" />
            <EntityUnavailableButton reason={tu("unavailable")} variant="default" className="gap-1">
              <ArrowUp className="h-3.5 w-3.5" />
              {t("upgrade")}
            </EntityUnavailableButton>
          </>
        }
      />

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto soft-scrollbar p-4 md:px-6 md:pb-6">
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          <div className="soft-elevated rounded-2xl border-0 bg-linear-to-br from-card to-sky-500/5 p-5">
            <div className="mb-3.5 flex justify-between gap-3">
              <div className="min-w-0">
                <EntitySectionHead
                  icon={<CreditCard className="size-4" aria-hidden />}
                  tone="sky"
                  className="mb-2"
                >
                  {t("currentPlan")}
                </EntitySectionHead>
                <p className="text-2xl font-semibold text-sky-600 dark:text-sky-400">
                  {t(`plan.${DETAIL_MOCK.plan}`)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold">4,200,000</p>
                <p className="text-[11px] text-muted-foreground">{t("perMonth")}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                [t("renewal"), "01/09/2026"],
                [t("cycle"), t("monthly")],
                [t("paymentStatus"), t("paid")],
                [t("method"), "VISA ****4242"],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {k}
                  </p>
                  <p
                    className={cn(
                      "text-xs font-semibold",
                      v === t("paid") ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                    )}
                  >
                    {v}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <EntityDetailPanel
            title={t("usage")}
            icon={<Gauge className="size-4" aria-hidden />}
            tone="emerald"
          >
            {DETAIL_MOCK.billingUsage.map((u) => (
              <div key={u.labelKey} className="mb-3 last:mb-0">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">{t(`usageLabels.${u.labelKey}`)}</span>
                  <span className="font-bold">
                    {u.used.toLocaleString()} / {u.total.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (u.used / u.total) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </EntityDetailPanel>
        </div>

        <EntityDetailPanel
          title={t("history")}
          icon={<FileText className="size-4" aria-hidden />}
          tone="amber"
        >
          {DETAIL_MOCK.billingHistory.map((h) => (
            <div
              key={h.labelKey}
              className="flex items-center justify-between gap-3 border-b border-border/60 py-2.5 last:border-0"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                <div>
                  <p className="text-xs font-semibold">{t(`historyLabels.${h.labelKey}`)}</p>
                  <p className="text-[11px] text-muted-foreground">{h.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold">{h.amount}</p>
                <Badge
                  variant="outline"
                  className={
                    h.status === "paid"
                      ? "border-transparent bg-emerald-500/15 text-[10px] text-emerald-700 dark:text-emerald-300"
                      : "border-transparent bg-destructive/15 text-[10px] text-destructive"
                  }
                >
                  {t(`paymentStatusLabels.${h.status}`)}
                </Badge>
              </div>
            </div>
          ))}
        </EntityDetailPanel>
      </div>
    </div>
  );
}
