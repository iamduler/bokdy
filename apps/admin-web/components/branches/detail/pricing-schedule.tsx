"use client";

import { Button, FieldError, FieldLabel, Input, TimePicker, ToggleGroup, ToggleGroupItem } from "@bokdy/ui";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useFormContext, useWatch, type FieldPath } from "react-hook-form";

import type { BranchPricingFormValues } from "@/lib/validation/branch-pricing";

import { CurrencyAmountInput } from "./currency-amount-input";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0] as const;

export type PricingWindow = {
  name: string;
  starts_at: string;
  ends_at: string;
  amount: number;
};

export type PricingGroup = {
  name: string;
  weekdays: number[];
  windows: PricingWindow[];
};

type WindowBase = `day_groups.${number}.windows.${number}` | `holiday_windows.${number}`;

export function blankPricingWindow(): PricingWindow {
  return { name: "", starts_at: "16:00", ends_at: "22:00", amount: Number.NaN };
}

function windowPath(base: WindowBase, field: keyof PricingWindow): FieldPath<BranchPricingFormValues> {
  return `${base}.${field}`;
}

export function PricingWindowCard({
  base,
  onRemove,
}: {
  base: WindowBase;
  onRemove: () => void;
}) {
  const t = useTranslations("organization.branchDetail.pricing");
  const tc = useTranslations("common");
  const { control } = useFormContext<BranchPricingFormValues>();

  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_auto] md:items-start md:gap-2">
      <div className="flex items-end gap-2 md:contents">
      <div className="grid min-w-0 flex-1 grid-cols-2 items-end gap-2 md:contents">
      <Controller
        control={control}
        name={windowPath(base, "starts_at")}
        render={({ field, fieldState }) => (
          <div className="min-w-0 space-y-1.5 md:col-start-1 md:row-start-1">
            <FieldLabel htmlFor={field.name} required>
              {t("startsAt")}
            </FieldLabel>
            <TimePicker
              id={field.name}
              value={typeof field.value === "string" ? field.value : ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={tc("pickTime")}
              hourLabel={tc("hour")}
              minuteLabel={tc("minute")}
              aria-label={t("startsAt")}
              aria-invalid={fieldState.invalid || undefined}
              className="justify-center px-2 [&_svg]:hidden"
            />
            <FieldError>{fieldState.error?.message}</FieldError>
          </div>
        )}
      />
      <Controller
        control={control}
        name={windowPath(base, "ends_at")}
        render={({ field, fieldState }) => (
          <div className="min-w-0 space-y-1.5 md:col-start-2 md:row-start-1">
            <FieldLabel htmlFor={field.name} required>
              {t("endsAt")}
            </FieldLabel>
            <TimePicker
              id={field.name}
              value={typeof field.value === "string" ? field.value : ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={tc("pickTime")}
              hourLabel={tc("hour")}
              minuteLabel={tc("minute")}
              aria-label={t("endsAt")}
              aria-invalid={fieldState.invalid || undefined}
              className="justify-center px-2 [&_svg]:hidden"
            />
            <FieldError>{fieldState.error?.message}</FieldError>
          </div>
        )}
      />
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="shrink-0 md:col-start-5 md:row-start-1 md:mt-7"
        aria-label={t("removeWindow")}
        onClick={onRemove}
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>
      </div>
      <div className="grid grid-cols-2 items-end gap-2 md:contents">
      <Controller
        control={control}
        name={windowPath(base, "name")}
        render={({ field, fieldState }) => (
          <div className="min-w-0 space-y-1.5 md:col-start-3 md:row-start-1">
            <FieldLabel htmlFor={field.name}>{t("windowName")}</FieldLabel>
            <Input
              id={field.name}
              value={typeof field.value === "string" ? field.value : ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              aria-invalid={fieldState.invalid || undefined}
            />
            <FieldError>{fieldState.error?.message}</FieldError>
          </div>
        )}
      />
      <Controller
        control={control}
        name={windowPath(base, "amount")}
        render={({ field, fieldState }) => (
          <div className="min-w-0 space-y-1.5 md:col-start-4 md:row-start-1">
            <FieldLabel htmlFor={field.name} required>
              {t("pricePerSlot")}
            </FieldLabel>
            <div className="flex items-center gap-2">
              <CurrencyAmountInput
                id={field.name}
                value={typeof field.value === "number" ? field.value : Number.NaN}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                aria-invalid={fieldState.invalid || undefined}
              />
              <span className="text-sm text-muted-foreground">{t("currencySuffix")}</span>
            </div>
            <FieldError>{fieldState.error?.message}</FieldError>
          </div>
        )}
      />
      </div>
    </div>
  );
}

export function PricingSchedule() {
  const t = useTranslations("organization.branchDetail.pricing");
  const tw = useTranslations("organization.branchDetail.weekdaysShort");
  const { control, getValues, setValue, formState } = useFormContext<BranchPricingFormValues>();
  const groups = useWatch({ control, name: "day_groups" }) ?? [];

  function commit(next: BranchPricingFormValues["day_groups"]) {
    setValue("day_groups", next, {
      shouldDirty: true,
      shouldValidate: formState.isSubmitted,
    });
  }

  return (
    <div className="space-y-3">
      {groups.length === 0 ? <p className="text-sm text-muted-foreground">{t("scheduleEmpty")}</p> : null}
      {groups.map((group, index) => (
        <section key={index} className="space-y-3 rounded-xl border border-border/70 p-3">
          <div className="flex items-end gap-2">
            <span className="mb-1.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {index + 1}
            </span>
            <Controller
              control={control}
              name={`day_groups.${index}.name`}
              render={({ field, fieldState }) => (
                <div className="min-w-0 flex-1 space-y-1.5">
                  <FieldLabel htmlFor={field.name}>{t("groupName")}</FieldLabel>
                  <Input
                    id={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="mb-0.5 shrink-0"
              aria-label={t("removeGroup")}
              onClick={() => commit(getValues("day_groups").filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
          <Controller
            control={control}
            name={`day_groups.${index}.weekdays`}
            render={({ field, fieldState }) => (
              <div className="min-w-0 space-y-1.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <FieldLabel required className="mr-1 shrink-0 text-xs font-normal text-muted-foreground">
                    {t("daysApply")}
                  </FieldLabel>
                  <div className="min-w-0 flex-1 overflow-x-auto soft-scrollbar">
                    <ToggleGroup
                      type="multiple"
                      value={field.value.map(String)}
                      onValueChange={(next) => field.onChange(next.map((value) => Number(value)))}
                      className="inline-flex w-max flex-nowrap gap-1.5"
                    >
                      {WEEKDAYS.map((day) => (
                        <ToggleGroupItem
                          key={day}
                          value={String(day)}
                          className="h-auto shrink-0 rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap data-[state=off]:border-border data-[state=off]:bg-background data-[state=off]:text-muted-foreground data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                        >
                          {tw(String(day))}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                </div>
                <FieldError>{fieldState.error?.message}</FieldError>
              </div>
            )}
          />
          <div>
            {group.windows.map((_, windowIndex) => (
              <div
                key={windowIndex}
                className={windowIndex > 0 ? "mt-3 border-t border-border/70 pt-3 md:mt-2 md:border-0 md:pt-0" : undefined}
              >
              <PricingWindowCard
                base={`day_groups.${index}.windows.${windowIndex}`}
                onRemove={() => {
                  const current = getValues("day_groups");
                  commit(
                    current.map((item, i) =>
                      i === index
                        ? { ...item, windows: item.windows.filter((_, wi) => wi !== windowIndex) }
                        : item,
                    ),
                  );
                }}
              />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const current = getValues("day_groups");
              commit(
                current.map((item, i) =>
                  i === index ? { ...item, windows: [...item.windows, blankPricingWindow()] } : item,
                ),
              );
            }}
          >
            <Plus className="size-3.5" aria-hidden />
            {t("addWindow")}
          </Button>
        </section>
      ))}
    </div>
  );
}
