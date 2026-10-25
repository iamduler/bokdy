"use client";

import { Button, Checkbox, FieldError, Input, toast } from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { softDirectoryPrimaryBtn, softDirectorySecondaryBtn } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { useBranchSchedule, usePutBranchSchedule } from "@/hooks/use-branch-schedule";
import type { BusinessHour } from "@/lib/api/branch-schedule";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import {
  branchScheduleSchema,
  type BranchScheduleFormValues,
} from "@/lib/validation/branch-schedule";

import { useBranchDetail } from "./branch-detail-context";
import { BranchTabBody, BranchTabError, BranchTabLoading } from "./branch-tab-state";

/** Display order: Monday first (API weekday 0 = Sunday … 6 = Saturday). */
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const DEFAULT_OPEN = "08:00";
const DEFAULT_CLOSE = "22:00";

function hhmm(value: string | undefined): string {
  return value ? value.slice(0, 5) : "";
}

function toFormValues(rows: BusinessHour[] | undefined): BranchScheduleFormValues {
  const byWeekday = new Map((rows ?? []).map((row) => [row.weekday, row]));
  return {
    days: WEEKDAY_ORDER.map((weekday) => {
      const row = byWeekday.get(weekday);
      return {
        weekday,
        // Unconfigured weekdays start closed until staff sets hours.
        is_closed: row ? row.is_closed : true,
        opens_at: hhmm(row?.opens_at) || DEFAULT_OPEN,
        closes_at: hhmm(row?.closes_at) || DEFAULT_CLOSE,
      };
    }),
  };
}

export function BranchScheduleView() {
  const t = useTranslations("organization.branchDetail.schedule");
  const tw = useTranslations("organization.branchDetail.weekdays");
  const te = useTranslations("errors");
  const { organizationId, branchId } = useBranchDetail();
  const { data, isLoading, isError, refetch, isFetching } = useBranchSchedule(
    organizationId,
    branchId,
  );
  const save = usePutBranchSchedule(organizationId, branchId);
  const [editing, setEditing] = useState(false);

  const schema = useMemo(
    () =>
      branchScheduleSchema({
        timeRequired: t("timeRequired"),
        rangeInvalid: t("rangeInvalid"),
      }),
    [t],
  );
  const form = useForm<BranchScheduleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(data),
  });
  const { register, control, handleSubmit, reset, watch, formState } = form;

  useEffect(() => {
    if (!editing) reset(toFormValues(data));
  }, [data, editing, reset]);

  async function onSubmit(values: BranchScheduleFormValues) {
    try {
      await save.mutateAsync({
        days: [...values.days]
          .sort((a, b) => a.weekday - b.weekday)
          .map((day) =>
            day.is_closed
              ? { weekday: day.weekday, is_closed: true }
              : {
                  weekday: day.weekday,
                  is_closed: false,
                  opens_at: day.opens_at,
                  closes_at: day.closes_at,
                },
          ),
      });
      toast.success(t("saved"));
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? te(errorMessageKey(err)) : t("loadError"));
    }
  }

  const view = toFormValues(data).days;

  return (
    <BranchTabBody>
      <EntityDetailPanel
        title={t("title")}
        icon={<CalendarClock className="size-4" aria-hidden />}
        tone="emerald"
        actions={
          !editing && data ? (
            <Button
              type="button"
              size="lg"
              className={softDirectorySecondaryBtn}
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-4" aria-hidden />
              {t("edit")}
            </Button>
          ) : null
        }
      >
        {isLoading ? (
          <BranchTabLoading />
        ) : isError || !data ? (
          <BranchTabError
            message={t("loadError")}
            onRetry={() => void refetch()}
            retryDisabled={isFetching}
          />
        ) : editing ? (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
            <ul className="divide-y divide-border/40">
              {WEEKDAY_ORDER.map((weekday, index) => {
                const closed = watch(`days.${index}.is_closed`);
                const opensError = formState.errors.days?.[index]?.opens_at?.message;
                const closesError = formState.errors.days?.[index]?.closes_at?.message;
                return (
                  <li
                    key={weekday}
                    className="flex flex-wrap items-start gap-x-4 gap-y-2 py-3"
                  >
                    <span className="w-28 shrink-0 pt-2 text-sm font-medium text-foreground">
                      {tw(String(weekday))}
                    </span>
                    <Controller
                      control={control}
                      name={`days.${index}.is_closed`}
                      render={({ field }) => (
                        <label className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(next) => field.onChange(next === true)}
                            aria-label={`${tw(String(weekday))}: ${t("closed")}`}
                          />
                          {t("closed")}
                        </label>
                      )}
                    />
                    {!closed ? (
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="space-y-1">
                          <Input
                            type="time"
                            className="w-32"
                            aria-label={`${tw(String(weekday))}: ${t("opensAt")}`}
                            aria-invalid={Boolean(opensError) || undefined}
                            {...register(`days.${index}.opens_at`)}
                          />
                          <FieldError>{opensError}</FieldError>
                        </div>
                        <span className="pt-2 text-sm text-muted-foreground">–</span>
                        <div className="space-y-1">
                          <Input
                            type="time"
                            className="w-32"
                            aria-label={`${tw(String(weekday))}: ${t("closesAt")}`}
                            aria-invalid={Boolean(closesError) || undefined}
                            {...register(`days.${index}.closes_at`)}
                          />
                          <FieldError>{closesError}</FieldError>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                size="lg"
                className={softDirectorySecondaryBtn}
                disabled={save.isPending}
                onClick={() => {
                  reset(toFormValues(data));
                  setEditing(false);
                }}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                size="lg"
                className={softDirectoryPrimaryBtn}
                disabled={save.isPending || !formState.isDirty}
              >
                {t("save")}
              </Button>
            </div>
          </form>
        ) : (
          <ul className="divide-y divide-border/40">
            {view.map((day) => (
              <li
                key={day.weekday}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="text-sm font-medium text-foreground">
                  {tw(String(day.weekday))}
                </span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {day.is_closed ? t("closed") : `${day.opens_at} – ${day.closes_at}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </EntityDetailPanel>
    </BranchTabBody>
  );
}
