"use client";

import {
  Button,
  DatePicker,
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
  const dirty =
    draft
      .map((row) => `${row.holiday_on}|${row.name.trim()}|${row.effect}`)
      .sort()
      .join("\n") !== signature;

  useEffect(() => {
    setDraft(rows);
    // Reset only when the saved list changes, not when the parent recreates the array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  function update(index: number, patch: Partial<HolidayDraft>) {
    setDraft((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function save() {
    const incomplete = draft.some((row) => (row.holiday_on || row.name.trim()) && !(row.holiday_on && row.name.trim()));
    if (incomplete) {
      toast.error(t("incomplete"));
      return;
    }
    try {
      await onSave(
        draft
          .filter((row) => row.holiday_on && row.name.trim())
          .map((row) => ({ holiday_on: row.holiday_on, name: row.name.trim(), effect: row.effect })),
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
              <Button type="button" size="sm" onClick={() => setDraft([...draft, { holiday_on: "", name: "", effect: "include" }])}>
                {t("addDate")}
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
                <TableCell>
                  <DatePicker
                    value={row.holiday_on}
                    onChange={(value) => update(index, { holiday_on: value })}
                    locale={locale}
                    placeholder={tc("pickDate")}
                    aria-label={t("date")}
                  />
                </TableCell>
                <TableCell>
                  <Input value={row.name} aria-label={t("name")} onChange={(event) => update(index, { name: event.target.value })} />
                </TableCell>
                {showEffect ? (
                  <TableCell>
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
                <TableCell>
                  <Button type="button" size="sm" variant="outline" className="h-9" onClick={() => setDraft(draft.filter((_, i) => i !== index))}>
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
          <Button type="button" size="sm" variant="outline" onClick={() => setDraft([...draft, { holiday_on: "", name: "", effect: "include" }])}>
            {t("addDate")}
          </Button>
          {showEffect ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setDraft([...draft, { holiday_on: "", name: "", effect: "exclude" }])}>
              {t("addExclude")}
            </Button>
          ) : null}
          <Button type="button" size="sm" disabled={!dirty || pending} onClick={() => void save()}>
            {t("save")}
          </Button>
        </div>
      )}
    </div>
  );
}
