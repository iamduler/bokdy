"use client";

import { Button, DatePicker, FieldLabel, Input, toast } from "@bokdy/ui";
import { CalendarDays } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { softDirectoryPrimaryBtn } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { PopoverCommandSelect } from "@/components/popover-command-select";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import type { BranchHoliday, HolidayEffect } from "@/lib/api/pricing";
import { useBranchHolidays, useReplaceBranchHolidays } from "@/hooks/use-pricing";

import { useBranchDetail } from "./branch-detail-context";
import { BranchTabBody, BranchTabError, BranchTabLoading } from "./branch-tab-state";

type Overlay = { holiday_on: string; name: string; effect: HolidayEffect };

export function BranchHolidaysView() {
  const t = useTranslations("organization.holidays");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const locale = useLocale();
  const effectOptions = [
    { value: "include", label: t("include"), keywords: t("include") },
    { value: "exclude", label: t("exclude"), keywords: t("exclude") },
  ];
  const { organizationId, branchId } = useBranchDetail();
  const query = useBranchHolidays(organizationId, branchId);
  const save = useReplaceBranchHolidays(organizationId, branchId);
  const [overlay, setOverlay] = useState<Overlay[]>([]);

  useEffect(() => {
    setOverlay(
      (query.data?.holidays ?? [])
        .filter((holiday) => holiday.source === "branch")
        .map((holiday) => ({ holiday_on: holiday.holiday_on, name: holiday.name, effect: holiday.effect })),
    );
  }, [query.data]);

  const covered = new Set(overlay.map((row) => row.holiday_on));
  const inherited = (query.data?.holidays ?? []).filter((holiday) => holiday.source !== "branch" && !covered.has(holiday.holiday_on));

  function addOverlay(holiday: BranchHoliday, effect: HolidayEffect) {
    if (covered.has(holiday.holiday_on)) return;
    setOverlay([...overlay, { holiday_on: holiday.holiday_on, name: holiday.name, effect }]);
  }

  async function onSave() {
    const incomplete = overlay.some((row) => (row.holiday_on || row.name.trim()) && !(row.holiday_on && row.name.trim()));
    if (incomplete) {
      toast.error(t("incomplete"));
      return;
    }
    try {
      await save.mutateAsync(
        overlay
          .filter((row) => row.holiday_on && row.name.trim())
          .map((row) => ({ holiday_on: row.holiday_on, name: row.name.trim(), effect: row.effect })),
      );
      toast.success(t("saved"));
    } catch (err) {
      toast.error(err instanceof ApiError ? te(errorMessageKey(err)) : t("loadError"));
    }
  }

  return (
    <BranchTabBody>
      <EntityDetailPanel title={t("title")} hint={t("branchHint")} icon={<CalendarDays className="size-4" aria-hidden />} tone="sky">
        {query.isLoading ? (
          <BranchTabLoading />
        ) : query.isError ? (
          <BranchTabError message={t("loadError")} onRetry={() => void query.refetch()} retryDisabled={query.isFetching} />
        ) : (
          <div className="space-y-4">
            {inherited.length === 0 && overlay.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : null}
            {inherited.map((holiday) => (
              <div key={`${holiday.source}-${holiday.holiday_on}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{holiday.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {holiday.holiday_on} · {t(`source.${holiday.source}`)} · {t(holiday.effect)}
                  </p>
                </div>
                {holiday.effect === "include" ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => addOverlay(holiday, "exclude")}>
                    {t("excludeDate")}
                  </Button>
                ) : (
                  <Button type="button" size="sm" variant="outline" onClick={() => addOverlay(holiday, "include")}>
                    {t("keepDate")}
                  </Button>
                )}
              </div>
            ))}
            {overlay.map((row, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[10rem_1fr_9rem_auto]">
                <div className="space-y-1.5">
                  <FieldLabel required>{t("date")}</FieldLabel>
                  <DatePicker
                    value={row.holiday_on}
                    onChange={(value) => {
                      const next = [...overlay];
                      next[index] = { ...row, holiday_on: value };
                      setOverlay(next);
                    }}
                    locale={locale}
                    placeholder={tc("pickDate")}
                    aria-label={t("date")}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>{t("name")}</FieldLabel>
                  <Input
                    value={row.name}
                    onChange={(event) => {
                      const next = [...overlay];
                      next[index] = { ...row, name: event.target.value };
                      setOverlay(next);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>{t("effect")}</FieldLabel>
                  <PopoverCommandSelect
                    value={row.effect}
                    onValueChange={(value) => {
                      const next = [...overlay];
                      next[index] = { ...row, effect: value as HolidayEffect };
                      setOverlay(next);
                    }}
                    options={effectOptions}
                    aria-label={t("effect")}
                    searchable={false}
                    align="start"
                    className="w-full border border-input bg-background"
                  />
                </div>
                <Button type="button" size="sm" variant="outline" className="self-end" onClick={() => setOverlay(overlay.filter((_, i) => i !== index))}>
                  {t("remove")}
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setOverlay([...overlay, { holiday_on: "", name: "", effect: "include" }])}>
                {t("addDate")}
              </Button>
              <Button type="button" size="sm" className={softDirectoryPrimaryBtn} disabled={save.isPending} onClick={() => void onSave()}>
                {t("save")}
              </Button>
            </div>
          </div>
        )}
      </EntityDetailPanel>
    </BranchTabBody>
  );
}
