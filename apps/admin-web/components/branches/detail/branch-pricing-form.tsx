"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  FieldError,
  FieldLabel,
  Input,
  Switch,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  cn,
  toast,
} from "@bokdy/ui";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";

import { sportLabel } from "@/components/branches/branch-sports-chips";
import { InfoHint } from "@/components/info-hint";
import { PopoverCommandSelect } from "@/components/popover-command-select";
import {
  softDirectoryPrimaryBtn,
  softDirectorySecondaryBtn,
} from "@/components/data-list";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import {
  PRICING_STATUS_TONE,
  pricingStatusKey,
} from "@/components/pricing-profiles/pricing-status";
import { usePageShellLeading } from "@/components/shell/shell-title";
import { Link } from "@/i18n/navigation";
import { EntityActionDialog } from "@/components/entity/action-dialog";
import { useBranch } from "@/hooks/use-branches";
import {
  useActivateBranchPricing,
  useCreateBranchPricing,
  useSaveBranchPricing,
} from "@/hooks/use-pricing";
import { useSports } from "@/hooks/use-sports";
import type {
  BranchPricingProfile,
  SaveBranchPricingProfileRequest,
} from "@/lib/api/pricing";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import {
  CUSTOMER_TYPES,
  SLOT_UNITS,
  branchPricingSchema,
  durationChoices,
  type BranchPricingFormValues,
} from "@/lib/validation/branch-pricing";
import {
  blocksPublish,
  blocksSave,
  conflictPairs,
  scheduleIssues,
} from "@/lib/validation/schedule-issues";

import { CurrencyAmountInput } from "./currency-amount-input";
import {
  PricingSchedule,
  PricingWindowCard,
  blankPricingWindow,
  type PricingGroup,
} from "./pricing-schedule";

function clockValue(value: string) {
  return value.slice(0, 5);
}

function firstMessage(node: unknown): string | undefined {
  if (!node || typeof node !== "object") return undefined;
  if ("message" in node && typeof node.message === "string" && node.message) return node.message;
  for (const value of Object.values(node)) {
    const found = firstMessage(value);
    if (found) return found;
  }
  return undefined;
}

function toGroup(
  group: NonNullable<BranchPricingProfile["day_groups"]>[number],
): PricingGroup {
  return {
    name: group.name ?? "",
    weekdays: group.weekdays ?? [],
    windows: (group.windows ?? []).map((window) => ({
      name: window.name ?? "",
      starts_at: clockValue(window.starts_at),
      ends_at: clockValue(window.ends_at),
      amount: window.amount,
    })),
  };
}

function toValues(
  profile: BranchPricingProfile | undefined,
  suggestedBase: number | null | undefined,
  sportId: string,
): BranchPricingFormValues {
  return {
    name: profile?.name ?? "",
    sport_id: profile?.sport_id ?? sportId,
    customer_type: profile?.customer_type ?? "walk_in",
    slot_unit_minutes: profile?.slot_unit_minutes ?? 60,
    unlimited_duration: profile?.unlimited_duration ?? false,
    durations: profile?.durations ?? [60, 120, 180],
    base_amount: profile?.base_amount ?? suggestedBase ?? 0,
    day_groups: (profile?.day_groups ?? []).map(toGroup),
    holiday_windows: (profile?.holiday_windows ?? []).map((window) => ({
      name: window.name ?? "",
      starts_at: clockValue(window.starts_at),
      ends_at: clockValue(window.ends_at),
      amount: window.amount,
    })),
  };
}

function flatWindows(groups: BranchPricingFormValues["day_groups"]) {
  return groups.flatMap((group) =>
    group.windows.map((window) => ({
      weekdays: group.weekdays,
      starts_at: window.starts_at,
      ends_at: window.ends_at,
      amount: Number(window.amount),
    })),
  );
}

function toRequest(
  values: BranchPricingFormValues,
): SaveBranchPricingProfileRequest {
  return {
    sport_id: values.sport_id,
    name: values.name.trim(),
    customer_type: values.customer_type,
    slot_unit_minutes: Number(values.slot_unit_minutes),
    unlimited_duration: values.unlimited_duration,
    durations: values.unlimited_duration ? [] : values.durations,
    base_amount: Number(values.base_amount),
    day_groups: values.day_groups.map((group) => ({
      name: group.name.trim(),
      weekdays: group.weekdays,
      windows: group.windows.map((window) => ({
        name: window.name.trim(),
        weekdays: group.weekdays,
        starts_at: window.starts_at,
        ends_at: window.ends_at,
        amount: Number(window.amount),
      })),
    })),
    holiday_windows: values.holiday_windows.map((window) => ({
      name: window.name.trim(),
      starts_at: window.starts_at,
      ends_at: window.ends_at,
      amount: Number(window.amount),
    })),
  };
}

export function BranchPricingForm({
  organizationId,
  branchId,
  profile,
  sportOptions = [],
  initialSportId = "",
  suggestedBase,
  onDone,
  onSaved,
}: {
  organizationId: string;
  branchId: string;
  profile?: BranchPricingProfile;
  sportOptions?: { id: string; label: string; suggestedBase: number | null }[];
  initialSportId?: string;
  suggestedBase?: number | null;
  onDone?: () => void;
  onSaved?: (profile: BranchPricingProfile) => void;
}) {
  const t = useTranslations("organization.branchDetail.pricing");
  const tShell = useTranslations("shell");
  const te = useTranslations("errors");
  const locale = useLocale();
  const creating = !profile;
  const create = useCreateBranchPricing(organizationId, branchId);
  const save = useSaveBranchPricing(organizationId, branchId);
  const activate = useActivateBranchPricing(organizationId, branchId);
  const pending = create.isPending || save.isPending || activate.isPending;
  const schema = useMemo(
    () =>
      branchPricingSchema({
        name: t("nameRequired"),
        slot: t("slotInvalid"),
        durations: t("durationsRequired"),
        amount: t("amountInvalid"),
        window: t("windowInvalid"),
        clock: t("clockInvalid"),
        order: t("issueOrder"),
        conflict: t("issueConflict"),
        sport: t("sportRequired"),
        group: t("groupRequired"),
      }),
    [t],
  );
  const form = useForm<BranchPricingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toValues(
      profile,
      suggestedBase,
      profile?.sport_id ?? initialSportId,
    ),
  });
  const slotUnit =
    useWatch({ control: form.control, name: "slot_unit_minutes" }) || 60;
  const watchedGroups = useWatch({ control: form.control, name: "day_groups" });
  const watchedHolidays = useWatch({
    control: form.control,
    name: "holiday_windows",
  });
  const watchedSportId = useWatch({ control: form.control, name: "sport_id" });
  const watchedDurations = useWatch({
    control: form.control,
    name: "durations",
  });
  const watchedUnlimited = useWatch({
    control: form.control,
    name: "unlimited_duration",
  });
  const watchedAudience = useWatch({
    control: form.control,
    name: "customer_type",
  });
  const choices = durationChoices(Number(slotUnit) || 60);
  const formId = profile?.id ?? "new";
  const [confirming, setConfirming] = useState(false);
  const [activateOnCreate, setActivateOnCreate] = useState(false);
  const [conflicts, setConflicts] = useState<{ left: string; right: string }[]>(
    [],
  );
  const branchQuery = useBranch(branchId, organizationId);
  const { data: sports = [] } = useSports();
  const sport = sports.find(
    (item) => item.id === (profile?.sport_id || watchedSportId),
  );
  const sportName = sport ? sportLabel(sport, locale) : "";

  useEffect(() => {
    form.reset(
      toValues(profile, suggestedBase, profile?.sport_id ?? initialSportId),
    );
  }, [form, profile, suggestedBase, initialSportId]);

  useEffect(() => {
    const allowed = new Set(durationChoices(Number(slotUnit) || 60));
    const current = form.getValues("durations");
    const next = current.filter((minutes) => allowed.has(minutes));
    if (next.length !== current.length) {
      form.setValue("durations", next, {
        shouldValidate: form.formState.isSubmitted,
      });
    }
  }, [form, slotUnit]);

  function pairLabels(
    windows: {
      starts_at: string;
      ends_at: string;
      weekdays: number[];
      amount: number;
    }[],
  ) {
    return conflictPairs(windows).map((pair) => ({
      left: `${windows[pair.left].starts_at}–${windows[pair.left].ends_at}`,
      right: `${windows[pair.right].starts_at}–${windows[pair.right].ends_at}`,
    }));
  }

  function reviewSchedule(values: BranchPricingFormValues) {
    const weekdayWindows = flatWindows(values.day_groups);
    const holidayWindows = values.holiday_windows.map((window) => ({
      weekdays: [1],
      starts_at: window.starts_at,
      ends_at: window.ends_at,
      amount: Number(window.amount),
    }));
    const pairs = [
      ...pairLabels(weekdayWindows),
      ...pairLabels(holidayWindows),
    ];
    if (pairs.length > 0) setConflicts(pairs);
    return {
      pairs,
      lists: [
        ...scheduleIssues(weekdayWindows),
        ...scheduleIssues(holidayWindows),
      ],
    };
  }

  async function submit(
    values: BranchPricingFormValues,
    mode: "create" | "save" | "activate",
    options?: { draft?: boolean },
  ) {
    const { lists, pairs } = reviewSchedule(values);
    if (pairs.length > 0) {
      toast.error(t("scheduleSaveBlocked"));
      return;
    }
    if ((mode === "create" || mode === "save") && lists.some(blocksSave)) {
      toast.error(t("scheduleSaveBlocked"));
      return;
    }
    if (mode === "activate" && lists.some(blocksPublish)) {
      toast.error(t("scheduleInvalid"));
      return;
    }
    const body = toRequest(values);
    try {
      if (mode === "create") {
        const saved = await create.mutateAsync(body);
        if (activateOnCreate && !options?.draft) {
          try {
            const published = await activate.mutateAsync({
              ...body,
              profileId: saved.id,
            });
            toast.success(t("activated"));
            onSaved?.(published);
          } catch (err) {
            toast.error(
              err instanceof ApiError
                ? te(errorMessageKey(err))
                : t("loadError"),
            );
            onSaved?.(saved);
          }
          return;
        }
        toast.success(t("created"));
        onSaved?.(saved);
        return;
      }
      if (mode === "activate") {
        const saved = await activate.mutateAsync({
          ...body,
          profileId: profile?.id,
        });
        toast.success(t("activated"));
        onSaved?.(saved);
        return;
      }
      const saved = await save.mutateAsync({ ...body, profileId: profile?.id });
      toast.success(t("saved"));
      onSaved?.(saved);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? te(errorMessageKey(err)) : t("loadError"),
      );
    }
  }

  const branchName = branchQuery.data?.name ?? "";
  const groups = watchedGroups ?? [];
  const holidays = watchedHolidays ?? [];
  const statusKey = profile ? pricingStatusKey(profile) : null;
  const audienceLabel = t(`audience.${watchedAudience}`);
  const shellBack = usePageShellLeading(
    creating ? (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 rounded-full text-muted-foreground hover:bg-muted/70"
        aria-label={tShell("menuBack")}
        onClick={() => onDone?.()}
      >
        <ArrowLeft className="size-4" />
      </Button>
    ) : null,
  );

  function replaceGroups(next: BranchPricingFormValues["day_groups"]) {
    form.setValue("day_groups", next, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });
  }

  function replaceHolidays(next: BranchPricingFormValues["holiday_windows"]) {
    form.setValue("holiday_windows", next, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });
  }

  return (
    <FormProvider {...form}>
    <form
      className="space-y-5"
      noValidate
      onSubmit={form.handleSubmit(
        (values) => submit(values, creating ? "create" : "save"),
        (errors) => {
          const message = firstMessage(errors);
          if (message) toast.error(message);
        },
      )}
    >
      {shellBack}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {creating ? t("formCreateTitle") : profile.name}
            </h1>
            {creating ? (
              <SoftStatusChip
                label={activateOnCreate ? t("willActivate") : t("draft")}
                tone={activateOnCreate ? "emerald" : "amber"}
              />
            ) : statusKey ? (
              <SoftStatusChip
                label={
                  statusKey === "activeBadge" ? t("activeLive") : t(statusKey)
                }
                tone={PRICING_STATUS_TONE[statusKey]}
              />
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {creating
              ? t("formCreateLead", { branch: branchName })
              : t("contextLine", { branch: branchName, sport: sportName })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {creating ? (
            <Button
              type="button"
              className={softDirectorySecondaryBtn}
              disabled={pending}
              onClick={() =>
                void form.handleSubmit(
                  (values) => submit(values, "create", { draft: true }),
                  (errors) => {
                    const message = firstMessage(errors);
                    if (message) toast.error(message);
                  },
                )()
              }
            >
              {t("saveDraft")}
            </Button>
          ) : null}
          <Button
            type="button"
            className={softDirectorySecondaryBtn}
            onClick={() => {
              const { lists, pairs } = reviewSchedule(form.getValues());
              if (pairs.length > 0 || lists.some(blocksPublish))
                toast.error(t("scheduleInvalid"));
              else toast.success(t("scheduleValid"));
            }}
          >
            {t("checkOverlap")}
          </Button>
          <Button
            type="submit"
            className={
              creating
                ? softDirectoryPrimaryBtn
                : softDirectorySecondaryBtn
            }
            disabled={pending}
          >
            {creating ? t("createList") : t("save")}
          </Button>
          {!creating && !profile.published ? (
            <Button
              type="button"
              className={softDirectoryPrimaryBtn}
              disabled={pending}
              onClick={() => setConfirming(true)}
            >
              {t("activate")}
            </Button>
          ) : null}
        </div>
      </header>

      <FormSection index={1} title={t("sectionBasic")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <FieldLabel htmlFor={`${formId}-name`} required>
                {t("name")}
              </FieldLabel>
              <InfoHint text={t("nameHint")} />
            </div>
            <Input id={`${formId}-name`} {...form.register("name")} />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <FieldLabel htmlFor={`${formId}-sport`} required>
                {t("sport")}
              </FieldLabel>
              <InfoHint text={t("sportHint")} />
            </div>
            {creating ? (
              <PopoverCommandSelect
                value={watchedSportId}
                onValueChange={(value) =>
                  form.setValue("sport_id", value, {
                    shouldValidate: form.formState.isSubmitted,
                    shouldDirty: true,
                  })
                }
                options={sportOptions.map((option) => ({
                  value: option.id,
                  label: option.label,
                  keywords: option.label,
                }))}
                placeholder={t("sportPlaceholder")}
                aria-label={t("sport")}
                searchable={false}
                className="w-full border border-input bg-background"
              />
            ) : (
              <p className="flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm">
                {sportName}
              </p>
            )}
            <FieldError>{form.formState.errors.sport_id?.message}</FieldError>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <FieldLabel required>{t("audienceApply")}</FieldLabel>
            <InfoHint text={t("audienceRule")} />
          </div>
          <Controller
            control={form.control}
            name="customer_type"
            render={({ field }) => (
              <ToggleGroup
                type="single"
                value={field.value}
                onValueChange={(next) => {
                  if (creating && next) field.onChange(next);
                }}
                className="grid gap-2 sm:grid-cols-3"
              >
                {CUSTOMER_TYPES.map((type) => {
                  const selected = field.value === type;
                  const locked = !creating && !selected;
                  return (
                    <ToggleGroupItem
                      key={type}
                      value={type}
                      disabled={locked}
                      className="h-auto items-start justify-start rounded-xl border p-3 text-left data-[state=off]:border-border data-[state=off]:bg-card data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                    >
                      <span className="flex w-full items-center justify-between gap-2 text-sm font-medium">
                        {t(`audience.${type}`)}
                        {selected ? <Check className="size-4 text-primary" aria-hidden /> : null}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {t(`audienceDesc.${type}`)}
                      </span>
                    </ToggleGroupItem>
                  );
                })}
              </ToggleGroup>
            )}
          />
        </div>

        {creating ? (
          <div className="space-y-2 rounded-xl border border-border/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">
                    {t("activateAfterCreate")}
                  </p>
                  <InfoHint
                    text={t("activateAfterCreateLead", {
                      sport: sportName || t("sport"),
                      branch: branchName,
                      audience: audienceLabel,
                    })}
                  />
                </div>
              </div>
              <Switch
                checked={activateOnCreate}
                onCheckedChange={setActivateOnCreate}
                aria-label={t("activateAfterCreate")}
                className="data-[state=checked]:bg-sky-600"
              />
            </div>
            {activateOnCreate ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {t("activateReplaces", { audience: audienceLabel })}
              </p>
            ) : null}
          </div>
        ) : null}
      </FormSection>

      <FormSection index={2} title={t("sectionDuration")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <FieldLabel required>{t("slotUnit")}</FieldLabel>
              <InfoHint text={t("slotHint", { count: Number(slotUnit) || 60 })} />
            </div>
            <PopoverCommandSelect
              value={String(Number(slotUnit) || 60)}
              onValueChange={(value) =>
                form.setValue("slot_unit_minutes", Number(value), {
                  shouldValidate: form.formState.isSubmitted,
                  shouldDirty: true,
                })
              }
              options={SLOT_UNITS.map((minutes) => ({
                value: String(minutes),
                label: t("minutes", { count: minutes }),
                keywords: String(minutes),
              }))}
              aria-label={t("slotUnit")}
              searchable={false}
              className="w-full border border-input bg-background"
            />
            <FieldError>
              {form.formState.errors.slot_unit_minutes?.message}
            </FieldError>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <FieldLabel htmlFor={`${formId}-base`} required>
                {t("baseSlotTitle")}
              </FieldLabel>
              <InfoHint text={t("baseSlotLead")} />
            </div>
            <div className="flex items-center gap-2">
            <Controller
              control={form.control}
              name="base_amount"
              render={({ field }) => (
                <CurrencyAmountInput
                  id={`${formId}-base`}
                  value={Number(field.value)}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
              )}
            />
              <span className="text-sm text-muted-foreground">
                {t("currencySuffix")}
              </span>
            </div>
            <FieldError>{form.formState.errors.base_amount?.message}</FieldError>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <FieldLabel required={!watchedUnlimited}>
              {t("durations")}
            </FieldLabel>
            <InfoHint
              text={
                watchedUnlimited
                  ? t("durationUnlimitedLead")
                  : t("durationChipLead")
              }
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <ToggleGroup
              type="multiple"
              value={watchedDurations.map(String)}
              disabled={watchedUnlimited}
              onValueChange={(next) =>
                form.setValue(
                  "durations",
                  next.map(Number).sort((a, b) => a - b),
                  { shouldValidate: form.formState.isSubmitted },
                )
              }
              className={cn("gap-2", watchedUnlimited && "opacity-50")}
            >
              {choices.map((minutes) => (
                <ToggleGroupItem
                  key={minutes}
                  value={String(minutes)}
                  className="h-auto rounded-full border px-3 py-1 text-sm data-[state=off]:border-border data-[state=off]:text-foreground data-[state=on]:border-sky-600 data-[state=on]:bg-sky-600 data-[state=on]:text-white"
                >
                  {t("minutes", { count: minutes })}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Toggle
              pressed={watchedUnlimited}
              onPressedChange={(pressed) =>
                form.setValue("unlimited_duration", pressed, {
                  shouldValidate: form.formState.isSubmitted,
                })
              }
              className="h-auto rounded-full border px-3 py-1 text-sm data-[state=off]:border-border data-[state=on]:border-sky-600 data-[state=on]:bg-sky-600 data-[state=on]:text-white"
            >
              {t("unlimited")}
            </Toggle>
          </div>
          <FieldError>{form.formState.errors.durations?.message}</FieldError>
        </div>
      </FormSection>

      <FormSection index={3} title={t("sectionSchedule")}>
        <PricingSchedule />
        <Button
          type="button"
          className={softDirectorySecondaryBtn}
          onClick={() =>
            replaceGroups([
              ...groups,
              {
                name: "",
                weekdays: [1, 2, 3, 4, 5],
                windows: [blankPricingWindow()],
              },
            ])
          }
        >
          <Plus className="size-3.5" aria-hidden />
          {t("addGroup")}
        </Button>
      </FormSection>

      <FormSection index={4} title={t("sectionHoliday")}>
        <div className="flex flex-col gap-2 rounded-xl border border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium">{t("holidayManaged")}</p>
              <InfoHint text={t("holidayManagedLead")} />
            </div>
          </div>
          <Link
            href={`/branches/${branchId}/holidays`}
            className="text-sm font-medium text-sky-700 hover:underline"
          >
            {t("viewHolidays")}
          </Link>
        </div>
        {holidays.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("holidayEmpty")}</p>
        ) : null}
        <div className="space-y-2">
          {holidays.map((_, index) => (
            <PricingWindowCard
              key={index}
              base={`holiday_windows.${index}`}
              onRemove={() =>
                replaceHolidays(holidays.filter((_, i) => i !== index))
              }
            />
          ))}
        </div>
        <Button
          type="button"
          className={softDirectorySecondaryBtn}
          onClick={() =>
            replaceHolidays([
              ...holidays,
              {
                name: "",
                starts_at: "06:00",
                ends_at: "22:00",
                amount: Number.NaN,
              },
            ])
          }
        >
          <Plus className="size-3.5" aria-hidden />
          {t("addHolidayWindow")}
        </Button>
      </FormSection>

      <AlertDialog open={confirming} onOpenChange={(next) => { if (!next) setConfirming(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("activateTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("activateConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={() => {
                setConfirming(false);
                void form.handleSubmit(
                  (values) => submit(values, "activate"),
                  (errors) => {
                    const message = firstMessage(errors);
                    if (message) toast.error(message);
                  },
                )();
              }}
            >
              {t("activate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EntityActionDialog
        open={conflicts.length > 0}
        title={t("conflictTitle")}
        closeLabel={t("cancel")}
        onClose={() => setConflicts([])}
      >
        <ul className="space-y-1 text-sm text-muted-foreground">
          {conflicts.map((pair) => (
            <li key={`${pair.left}-${pair.right}`}>
              {pair.left} · {pair.right}
            </li>
          ))}
        </ul>
      </EntityActionDialog>
    </form>
    </FormProvider>
  );
}

function FormSection({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="soft-elevated space-y-4 rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
          {index}
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
