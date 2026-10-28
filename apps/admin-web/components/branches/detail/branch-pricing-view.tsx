"use client";

import { Badge } from "@bokdy/ui";
import { Clock, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { DataListEmpty } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { EntityUnavailableButton } from "@/components/entity/unavailable";
import { sportLabel } from "@/components/branches/branch-sports-chips";
import { useBranchCourts } from "@/hooks/use-courts";
import { usePriceVersion, usePriceVersions } from "@/hooks/use-pricing";
import { useSports } from "@/hooks/use-sports";

import { useBranchDetail } from "./branch-detail-context";
import { BranchTabBody, BranchTabError, BranchTabLoading } from "./branch-tab-state";

/** Read-only: active org price version, filtered to sports played on this branch's courts. */
export function BranchPricingView() {
  const t = useTranslations("organization.branchDetail.pricing");
  const tw = useTranslations("organization.branchDetail.weekdaysShort");
  const locale = useLocale();
  const { organizationId, branchId } = useBranchDetail();

  const versions = usePriceVersions(organizationId);
  const activeId = versions.data?.find((version) => version.status === "active")?.id;
  const version = usePriceVersion(organizationId, activeId);
  const courts = useBranchCourts(organizationId, branchId);
  const { data: sports = [] } = useSports();

  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
  const sportName = new Map(sports.map((sport) => [sport.id, sportLabel(sport, locale)]));
  const branchSportIds = new Set((courts.data ?? []).map((court) => court.sport_id));
  const allRates = version.data?.rates ?? [];
  const scoped = branchSportIds.size > 0;
  const rates = scoped
    ? allRates.filter((rate) => branchSportIds.has(rate.sport_id))
    : allRates;
  const rules = [...(version.data?.time_rules ?? [])].sort(
    (a, b) => (a.priority ?? 0) - (b.priority ?? 0),
  );

  const loading = versions.isLoading || (Boolean(activeId) && version.isLoading);
  const failed = versions.isError || version.isError;

  const cta = (
    <EntityUnavailableButton label={t("editCta")} reason={t("editHint")} />
  );

  return (
    <BranchTabBody>
      <EntityDetailPanel
        title={t("ratesTitle")}
        icon={<Wallet className="size-4" aria-hidden />}
        tone="sky"
        actions={cta}
      >
        {loading ? (
          <BranchTabLoading />
        ) : failed ? (
          <BranchTabError
            message={t("loadError")}
            onRetry={() => {
              void versions.refetch();
              void version.refetch();
            }}
            retryDisabled={versions.isFetching || version.isFetching}
          />
        ) : !activeId || !version.data ? (
          <DataListEmpty title={t("noActive")} className="py-10" />
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {t("versionMeta", {
                version: version.data.version,
                date: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                  new Date(version.data.effective_from),
                ),
              })}
            </p>
            {!scoped ? (
              <p className="text-xs text-muted-foreground">{t("noCourtsHint")}</p>
            ) : null}
            {rates.length === 0 ? (
              <DataListEmpty title={t("emptyRates")} className="py-8" />
            ) : (
              <ul className="divide-y divide-border/40">
                {rates.map((rate) => (
                  <li
                    key={rate.sport_id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {sportName.get(rate.sport_id) ?? t("emptyValue")}
                    </span>
                    <span className="text-sm tabular-nums text-foreground">
                      {t("perHour", { amount: money.format(rate.amount) })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </EntityDetailPanel>

      {activeId && version.data && !failed ? (
        <EntityDetailPanel
          title={t("rulesTitle")}
          icon={<Clock className="size-4" aria-hidden />}
          tone="amber"
        >
          {rules.length === 0 ? (
            <DataListEmpty title={t("emptyRules")} className="py-8" />
          ) : (
            <ul className="divide-y divide-border/40">
              {rules.map((rule, index) => {
                const isFixed = rule.value_type === "fixed";
                const value = isFixed
                  ? money.format(rule.value ?? 0)
                  : `${rule.value ?? 0}%`;
                const kind =
                  rule.adjustment_type === "discount" ? "discount" : "surcharge";
                return (
                  <li
                    key={rule.id ?? index}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium text-foreground tabular-nums">
                        {rule.starts_at} – {rule.ends_at}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(rule.weekdays ?? []).map((day) => tw(String(day))).join(", ")}
                      </p>
                    </div>
                    <Badge variant="outline" className="tabular-nums">
                      {t(`adjustment.${kind}`, { value })}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </EntityDetailPanel>
      ) : null}
    </BranchTabBody>
  );
}
