"use client";

import { Button, DatePicker, FieldLabel, Input, toast } from "@bokdy/ui";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { softDirectoryPrimaryBtn } from "@/components/data-list";
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
  const signature = rows.map((row) => `${row.holiday_on}|${row.name}|${row.effect}`).join("\n");
  const [draft, setDraft] = useState<HolidayDraft[]>(rows);

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
      {draft.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : null}
      {draft.map((row, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[10rem_1fr_9rem_auto]">
          <div className="space-y-1.5">
            <FieldLabel required>{t("date")}</FieldLabel>
            <DatePicker
              value={row.holiday_on}
              onChange={(value) => update(index, { holiday_on: value })}
              locale={locale}
              placeholder={tc("pickDate")}
              aria-label={t("date")}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel required>{t("name")}</FieldLabel>
            <Input value={row.name} onChange={(event) => update(index, { name: event.target.value })} />
          </div>
          {showEffect ? (
            <div className="space-y-1.5">
              <FieldLabel required>{t("effect")}</FieldLabel>
              <PopoverCommandSelect
                value={row.effect}
                onValueChange={(value) => update(index, { effect: value as HolidayEffect })}
                options={effectOptions}
                aria-label={t("effect")}
                searchable={false}
                align="start"
                className="w-full border border-input bg-background"
              />
            </div>
          ) : (
            <span />
          )}
          <Button type="button" size="sm" variant="outline" className="self-end" onClick={() => setDraft(draft.filter((_, i) => i !== index))}>
            {t("remove")}
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setDraft([...draft, { holiday_on: "", name: "", effect: "include" }])}>
          {t("addDate")}
        </Button>
        {showEffect ? (
          <Button type="button" size="sm" variant="outline" onClick={() => setDraft([...draft, { holiday_on: "", name: "", effect: "exclude" }])}>
            {t("addExclude")}
          </Button>
        ) : null}
        <Button type="button" size="sm" className={softDirectoryPrimaryBtn} disabled={pending} onClick={() => void save()}>
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
