"use client";

import { Badge, Button, cn, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { ArrowUp, FileText } from "lucide-react";
import { useTranslations } from "next-intl";

import { OrganizationDetailScreenHeader } from "../organization-detail-screen-header";
import { useOrganizationDetail } from "../organization-detail-context";
import { DetailPanel } from "../shared/detail-panel";
import { DetailSectionHead } from "../shared/detail-section-head";
import { DETAIL_MOCK } from "../shared/detail-mock-data";

function UnavailableButton({ label }: { label: string }) {
  const t = useTranslations("organization");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled>
            {label}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{t("unavailable")}</TooltipContent>
    </Tooltip>
  );
}

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
            <UnavailableButton label={t("viewInvoices")} />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button type="button" size="sm" className="h-8 gap-1 text-xs" disabled>
                    <ArrowUp className="h-3.5 w-3.5" />
                    {t("upgrade")}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{tu("unavailable")}</TooltipContent>
            </Tooltip>
          </>
        }
      />

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto soft-scrollbar p-4 md:px-6 md:pb-6">
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          <div className="rounded-xl border border-violet-500/30 bg-linear-to-br from-card to-violet-500/5 p-5">
            <div className="mb-3.5 flex justify-between">
              <div>
                <DetailSectionHead>{t("currentPlan")}</DetailSectionHead>
                <p className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">
                  {t(`plan.${DETAIL_MOCK.plan}`)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold">4,200,000</p>
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
                  <DetailSectionHead>{k}</DetailSectionHead>
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

          <DetailPanel title={t("usage")}>
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
          </DetailPanel>
        </div>

        <DetailPanel title={t("history")}>
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
                <Badge variant={h.status === "paid" ? "success" : "danger"} className="text-[10px]">
                  {t(`paymentStatusLabels.${h.status}`)}
                </Badge>
              </div>
            </div>
          ))}
        </DetailPanel>
      </div>
    </div>
  );
}
