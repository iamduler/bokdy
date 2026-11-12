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
} from "@bokdy/ui";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { DataListEmpty } from "@/components/data-list";
import { PopoverCommandSelect } from "@/components/popover-command-select";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import type { HolidayEffect, HolidayOverlayInput } from "@/lib/api/pricing";

export type HolidayDraft = { holiday_on: string; name: string; effect: HolidayEffect };

type RowErrors = { date?: boolean; name?: boolean };

function rowErrors(rows: HolidayDraft[]): RowErrors[] {
  return rows.map((row) => ({
    date: !row.holiday_on,
    name: !row.name.trim(),
  }));
}

export function HolidayLayerForm({
  rows,
  showEffect,
  pending,
  onSave,
}: {
  rows: HolidayDraft[];
  showEffect: boolean;
  pending: boolean;
  onSave: (rows: HolidayOverlayInput[]) => Promise<unknown>;
}) {
  const t = useTranslations("organization.holidays");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const locale = useLocale();
  const effectOptions = [
    { value: "include", label: t("include"), keywords: t("include") },
    { value: "exclude", label: t("exclude"), keywords: t("exclude") },
  ];
  const signature = rows
    .map((row) => `${row.holiday_on}|${row.name.trim()}|${row.effect}`)
    .sort()
    .join("\n");
  const [draft, setDraft] = useState<HolidayDraft[]>(rows);
  const [errors, setErrors] = useState<RowErrors[]>([]);
  const dirty =
    draft
      .map((row) => `${row.holiday_on}|${row.name.trim()}|${row.effect}`)
      .sort()
      .join("\n") !== signature;

  useEffect(() => {
    setDraft(rows);
    setErrors([]);
    // Reset only when the saved list changes, not when the parent recreates the array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  function update(index: number, patch: Partial<HolidayDraft>) {
    setDraft((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    setErrors((current) =>
      current.map((error, i) => {
        if (i !== index || !error) return error;
        return {
          date: patch.holiday_on !== undefined ? !patch.holiday_on : error.date,
          name: patch.name !== undefined ? !patch.name.trim() : error.name,
        };
      }),
    );
  }

  function addRow() {
    setDraft((current) => [...current, { holiday_on: "", name: "", effect: "include" }]);
  }

  async function save() {
    const nextErrors = rowErrors(draft);
    setErrors(nextErrors);
    if (nextErrors.some((error) => error.date || error.name)) return;
    try {
      await onSave(
        draft.map((row) => ({ holiday_on: row.holiday_on, name: row.name.trim(), effect: row.effect })),
      );
      toast.success(t("saved"));
    } catch (err) {
      toast.error(err instanceof ApiError ? te(errorMessageKey(err)) : t("loadError"));
    }
  }

  return (
    <div className="space-y-3">
      {draft.length === 0 ? (
        <DataListEmpty
          title={t("empty")}
          className="py-10"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" size="sm" onClick={addRow}>
                {t("addRow")}
              </Button>
              {dirty ? (
                <Button type="button" size="sm" disabled={pending} onClick={() => void save()}>
                  {t("save")}
                </Button>
              ) : null}
            </div>
          }
        />
      ) : null}
      {draft.length > 0 ? (
        <Table className={showEffect ? "min-w-[42rem]" : "min-w-[32rem]"}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-44">
                <FieldLabel required>{t("date")}</FieldLabel>
              </TableHead>
              <TableHead className="min-w-56">
                <FieldLabel required>{t("name")}</FieldLabel>
              </TableHead>
              {showEffect ? (
                <TableHead className="w-40">
                  <FieldLabel required>{t("effect")}</FieldLabel>
                </TableHead>
              ) : null}
              <TableHead className="w-20">
                <span className="sr-only">{t("remove")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {draft.map((row, index) => (
              <TableRow key={index} className="hover:bg-transparent">
                <TableCell className="align-top">
                  <DatePicker
                    value={row.holiday_on}
                    onChange={(value) => update(index, { holiday_on: value })}
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
                    onChange={(event) => update(index, { name: event.target.value })}
                  />
                  {errors[index]?.name ? <FieldError className="mt-1">{t("nameRequired")}</FieldError> : null}
                </TableCell>
                {showEffect ? (
                  <TableCell className="align-top">
                    <PopoverCommandSelect
                      value={row.effect}
                      onValueChange={(value) => update(index, { effect: value as HolidayEffect })}
                      options={effectOptions}
                      aria-label={t("effect")}
                      searchable={false}
                      align="start"
                      className="w-full border border-input bg-background"
                    />
                  </TableCell>
                ) : null}
                <TableCell className="align-top">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9"
                    onClick={() => {
                      setDraft(draft.filter((_, i) => i !== index));
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
      {draft.length === 0 ? null : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={addRow}>
            {t("addRow")}
          </Button>
          <Button type="button" size="sm" disabled={!dirty || pending} onClick={() => void save()}>
            {t("save")}
          </Button>
        </div>
      )}
    </div>
  );
}
