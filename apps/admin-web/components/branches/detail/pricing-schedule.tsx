"use client";

import { Button, cn, FieldError, FieldLabel, Input } from "@bokdy/ui";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useFormContext, useWatch, type FieldPath } from "react-hook-form";

import { softDirectorySecondaryBtn } from "@/components/data-list";
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
  const { control } = useFormContext<BranchPricingFormValues>();

  return (
    <div className="grid items-start gap-2 sm:grid-cols-[1.4fr_0.7fr_0.7fr_0.9fr_auto]">
      <Controller
        control={control}
        name={windowPath(base, "name")}
        render={({ field, fieldState }) => (
          <div className="space-y-1.5">
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
        name={windowPath(base, "starts_at")}
        render={({ field, fieldState }) => (
          <div className="space-y-1.5">
            <FieldLabel htmlFor={field.name} required>
              {t("startsAt")}
            </FieldLabel>
            <Input
              id={field.name}
              inputMode="numeric"
              placeholder="16:00"
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
        name={windowPath(base, "ends_at")}
        render={({ field, fieldState }) => (
          <div className="space-y-1.5">
            <FieldLabel htmlFor={field.name} required>
              {t("endsAt")}
            </FieldLabel>
            <Input
              id={field.name}
              inputMode="numeric"
              placeholder="22:00"
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
          <div className="space-y-1.5">
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
      <Button type="button" size="icon" variant="ghost" className="mt-7" aria-label={t("removeWindow")} onClick={onRemove}>
        <Trash2 className="size-4" aria-hidden />
      </Button>
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
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <span className="mb-1.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {index + 1}
            </span>
            <Controller
              control={control}
              name={`day_groups.${index}.name`}
              render={({ field, fieldState }) => (
                <div className="w-full max-w-xs space-y-1.5">
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
              className="mb-0.5"
              aria-label={t("removeGroup")}
              onClick={() => commit(getValues("day_groups").filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
            <Controller
              control={control}
              name={`day_groups.${index}.weekdays`}
              render={({ field, fieldState }) => (
                <div className="min-w-0 space-y-1.5 pb-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <FieldLabel required className="mr-1 text-xs font-normal text-muted-foreground">
                      {t("daysApply")}
                    </FieldLabel>
                    {WEEKDAYS.map((day) => {
                      const selected = field.value.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          aria-pressed={selected}
                          className={cn(
                            "rounded-md border px-2 py-1 text-xs font-medium",
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground",
                          )}
                          onClick={() => {
                            field.onChange(
                              selected
                                ? field.value.filter((value) => value !== day)
                                : [...field.value, day],
                            );
                          }}
                        >
                          {tw(String(day))}
                        </button>
                      );
                    })}
                  </div>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />
          </div>
          <div className="space-y-2">
            {group.windows.map((_, windowIndex) => (
              <PricingWindowCard
                key={windowIndex}
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
            ))}
          </div>
          <Button
            type="button"
            className={softDirectorySecondaryBtn}
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
