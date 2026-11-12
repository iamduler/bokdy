"use client";

import {
  Button,
  DatePicker,
  FieldError,
  FieldLabel,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
  formatUserDate,
  useUserDateTimePrefs,
} from "@bokdy/ui";
import { CalendarDays } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { DataListEmpty } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { PopoverCommandSelect } from "@/components/popover-command-select";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import type { BranchHoliday, HolidayEffect } from "@/lib/api/pricing";
import { useBranchHolidays, useReplaceBranchHolidays } from "@/hooks/use-pricing";

import { useBranchDetail } from "./branch-detail-context";
import { BranchTabBody, BranchTabError, BranchTabLoading } from "./branch-tab-state";

type Overlay = { holiday_on: string; name: string; effect: HolidayEffect };
type RowErrors = { date?: boolean; name?: boolean };

function rowErrors(rows: Overlay[]): RowErrors[] {
  return rows.map((row) => ({
    date: !row.holiday_on,
    name: !row.name.trim(),
  }));
}

function holidaySignature(rows: Overlay[]) {
  return rows
    .map((row) => `${row.holiday_on}|${row.name.trim()}|${row.effect}`)
    .sort()
    .join("\n");
}

export function BranchHolidaysView() {
  const t = useTranslations("organization.holidays");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const locale = useLocale();
  const prefs = useUserDateTimePrefs();
  const effectOptions = [
    { value: "include", label: t("include"), keywords: t("include") },
    { value: "exclude", label: t("exclude"), keywords: t("exclude") },
  ];
  const { organizationId, branchId } = useBranchDetail();
  const query = useBranchHolidays(organizationId, branchId);
  const save = useReplaceBranchHolidays(organizationId, branchId);
  const [overlay, setOverlay] = useState<Overlay[]>([]);
  const [errors, setErrors] = useState<RowErrors[]>([]);

  useEffect(() => {
    setOverlay(
      (query.data?.holidays ?? [])
        .filter((holiday) => holiday.source === "branch")
        .map((holiday) => ({ holiday_on: holiday.holiday_on, name: holiday.name, effect: holiday.effect })),
    );
    setErrors([]);
  }, [query.data]);

  const covered = new Set(overlay.map((row) => row.holiday_on));
  const inherited = (query.data?.holidays ?? []).filter((holiday) => holiday.source !== "branch" && !covered.has(holiday.holiday_on));
  const savedBranch = (query.data?.holidays ?? [])
    .filter((holiday) => holiday.source === "branch")
    .map((holiday) => ({ holiday_on: holiday.holiday_on, name: holiday.name, effect: holiday.effect }));
  const dirty = holidaySignature(overlay) !== holidaySignature(savedBranch);
  const isEmpty = inherited.length === 0 && overlay.length === 0;

  function addRow() {
    setOverlay([...overlay, { holiday_on: "", name: "", effect: "include" }]);
  }

  function addOverlay(holiday: BranchHoliday, effect: HolidayEffect) {
    if (covered.has(holiday.holiday_on)) return;
    setOverlay([...overlay, { holiday_on: holiday.holiday_on, name: holiday.name, effect }]);
  }

  async function onSave() {
    const nextErrors = rowErrors(overlay);
    setErrors(nextErrors);
    if (nextErrors.some((error) => error.date || error.name)) return;
    try {
      await save.mutateAsync(
        overlay.map((row) => ({ holiday_on: row.holiday_on, name: row.name.trim(), effect: row.effect })),
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
            {isEmpty ? (
              <DataListEmpty
                title={t("empty")}
                className="py-10"
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button type="button" size="sm" onClick={addRow}>
                      {t("addRow")}
                    </Button>
                    {dirty ? (
                      <Button type="button" size="sm" disabled={save.isPending} onClick={() => void onSave()}>
                        {t("save")}
                      </Button>
                    ) : null}
                  </div>
                }
              />
            ) : null}
            {inherited.map((holiday) => (
              <div key={`${holiday.source}-${holiday.holiday_on}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{holiday.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatUserDate(holiday.holiday_on, prefs)} · {t(`source.${holiday.source}`)} · {t(holiday.effect)}
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
            {overlay.length > 0 ? (
              <Table className="min-w-[42rem]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-44">
                      <FieldLabel required>{t("date")}</FieldLabel>
                    </TableHead>
                    <TableHead className="min-w-56">
                      <FieldLabel required>{t("name")}</FieldLabel>
                    </TableHead>
                    <TableHead className="w-40">
                      <FieldLabel required>{t("effect")}</FieldLabel>
                    </TableHead>
                    <TableHead className="w-20">
                      <span className="sr-only">{t("remove")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overlay.map((row, index) => (
                    <TableRow key={index} className="hover:bg-transparent">
                      <TableCell className="align-top">
                        <DatePicker
                          value={row.holiday_on}
                          onChange={(value) => {
                            const next = [...overlay];
                            next[index] = { ...row, holiday_on: value };
                            setOverlay(next);
                            setErrors((current) =>
                              current.map((error, i) => (i === index && error ? { ...error, date: !value } : error)),
                            );
                          }}
                          locale={locale}
                          placeholder={tc("pickDate")}
                          aria-label={t("date")}
                          aria-invalid={errors[index]?.date || undefined}
                        />
                        {errors[index]?.date ? <FieldError className="mt-1">{t("dateRequired")}</FieldError> : null}
                      </TableCell>
                      <TableCell className="align-top">
                        <Input
                          value={row.name}
                          aria-label={t("name")}
                          aria-invalid={errors[index]?.name || undefined}
                          onChange={(event) => {
                            const value = event.target.value;
                            const next = [...overlay];
                            next[index] = { ...row, name: value };
                            setOverlay(next);
                            setErrors((current) =>
                              current.map((error, i) => (i === index && error ? { ...error, name: !value.trim() } : error)),
                            );
                          }}
                        />
                        {errors[index]?.name ? <FieldError className="mt-1">{t("nameRequired")}</FieldError> : null}
                      </TableCell>
                      <TableCell className="align-top">
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
                      </TableCell>
                      <TableCell className="align-top">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-9"
                          onClick={() => {
                            setOverlay(overlay.filter((_, i) => i !== index));
                            setErrors((current) => current.filter((_, i) => i !== index));
                          }}
                        >
                          {t("remove")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
            {isEmpty ? null : (
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={addRow}>
                  {t("addRow")}
                </Button>
                <Button type="button" size="sm" disabled={!dirty || save.isPending} onClick={() => void onSave()}>
                  {t("save")}
                </Button>
              </div>
            )}
          </div>
        )}
      </EntityDetailPanel>
    </BranchTabBody>
  );
}
