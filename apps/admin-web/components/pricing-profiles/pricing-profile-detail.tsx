"use client";

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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  toast,
} from "@bokdy/ui";
import { BadgeCheck, CalendarDays, Clock, Copy, Pencil, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { PricingQuotePreview } from "@/components/branches/detail/pricing-quote-preview";
import { sportLabel } from "@/components/branches/branch-sports-chips";
import { softDirectoryPrimaryBtn, softDirectorySecondaryBtn } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { usePricingProfileDetail } from "@/components/pricing-profiles/pricing-profile-context";
import { PRICING_STATUS_TONE, pricingStatusKey } from "@/components/pricing-profiles/pricing-status";
import { useActivateBranchPricing, useDuplicateBranchPricing } from "@/hooks/use-pricing";
import { useBranch } from "@/hooks/use-branches";
import { useSports } from "@/hooks/use-sports";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import type { BranchPricingProfile } from "@/lib/api/pricing";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0] as const;

function formatAmount(locale: string, amount: number) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
}

function updatedStamp(locale: string, iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() < 2000) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function clock(value: string) {
  return value.slice(0, 5);
}

export function PricingProfileDetailView() {
  const t = useTranslations("organization.branchDetail.pricing");
  const tw = useTranslations("organization.branchDetail.weekdaysShort");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const { profile, organizationId, branchId } = usePricingProfileDetail();
  const { data: sports = [] } = useSports();
  const branch = useBranch(branchId, organizationId);
  const activate = useActivateBranchPricing(organizationId, branchId);
  const duplicate = useDuplicateBranchPricing(organizationId, branchId);
  const [testerOpen, setTesterOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const sport = sports.find((item) => item.id === profile.sport_id);
  const sportName = sport ? sportLabel(sport, locale) : profile.sport_id;
  const status = pricingStatusKey(profile);
  const statusLabel = status === "activeBadge" ? t("activeLive") : t(status);
  const price =
    profile.base_amount == null
      ? t("emptyValue")
      : profile.base_amount === 0
        ? t("freePrice")
        : `${formatAmount(locale, profile.base_amount)} ${t("currencySuffix")}`;
  const durationList = profile.durations ?? [];
  const durations = profile.unlimited_duration
    ? t("unlimited")
    : durationList.length === 0
      ? t("emptyValue")
      : durationList.map((minutes) => t("minutes", { count: minutes })).join(", ");
  const durationCaption =
    profile.unlimited_duration || durationList.length === 0
      ? undefined
      : t("durationSlotMultiple", {
          duration: t("minutes", { count: profile.slot_unit_minutes }),
        });
  const editHref = `/pricing-profiles/${profile.id}/edit`;
  const groups = profile.day_groups ?? [];
  const holidayWindows = profile.holiday_windows ?? [];
  const windowCount = groups.reduce((sum, group) => sum + (group.windows ?? []).length, 0);
  const updated = updatedStamp(locale, profile.updated_at);
  const branchName = branch.data?.name || t("emptyValue");
  const audience = t(`audience.${profile.customer_type}`);

  async function onActivate() {
    try {
      await activate.mutateAsync({
        profileId: profile.id,
        name: profile.name,
        customer_type: profile.customer_type,
        slot_unit_minutes: profile.slot_unit_minutes,
        unlimited_duration: profile.unlimited_duration,
        durations: profile.unlimited_duration ? [] : (profile.durations ?? []),
        base_amount: profile.base_amount ?? 0,
        day_groups: groups.map((group) => ({
          name: group.name,
          weekdays: group.weekdays,
          windows: (group.windows ?? []).map((window) => ({
            name: window.name,
            weekdays: group.weekdays,
            starts_at: window.starts_at,
            ends_at: window.ends_at,
            amount: window.amount,
          })),
        })),
        holiday_windows: holidayWindows.map((window) => ({
          name: window.name,
          starts_at: window.starts_at,
          ends_at: window.ends_at,
          amount: window.amount,
        })),
      });
      toast.success(t("activated"));
    } catch (err) {
      toast.error(err instanceof ApiError ? te(errorMessageKey(err)) : t("loadError"));
    }
  }

  async function onDuplicate() {
    try {
      const copy = await duplicate.mutateAsync(profile.id);
      toast.success(t("duplicated"));
      router.push(`/pricing-profiles/${copy.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? te(errorMessageKey(err)) : t("loadError"));
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold text-foreground">{profile.name}</h1>
            <SoftStatusChip label={statusLabel} tone={PRICING_STATUS_TONE[status]} />
          </div>
          <p className="text-sm text-muted-foreground">
            {updated ? t("updatedLine", { code: profile.code, updated }) : profile.code}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            className={softDirectorySecondaryBtn}
            disabled={duplicate.isPending}
            onClick={() => void onDuplicate()}
          >
            <Copy className="size-3.5" aria-hidden />
            {t("duplicate")}
          </Button>
          <Button
            type="button"
            size="sm"
            className={softDirectorySecondaryBtn}
            onClick={() => setTesterOpen(true)}
          >
            <Search className="size-3.5" aria-hidden />
            {t("testPrice")}
          </Button>
          {profile.published ? (
            <Button asChild size="sm" className={softDirectoryPrimaryBtn}>
              <Link href={editHref}>
                <Pencil className="size-3.5" aria-hidden />
                {t("editDetail")}
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" className={softDirectorySecondaryBtn}>
                <Link href={editHref}>
                  <Pencil className="size-3.5" aria-hidden />
                  {t("editDetail")}
                </Link>
              </Button>
              <Button
                type="button"
                size="sm"
                className={softDirectoryPrimaryBtn}
                disabled={activate.isPending}
                onClick={() => setConfirming(true)}
              >
                {t("activate")}
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t("customerType")} value={audience} caption={t("audienceCaption")} />
        <StatCard
          label={t("basePrice")}
          value={price}
          caption={t("perSlot", { duration: t("minutes", { count: profile.slot_unit_minutes }) })}
        />
        <StatCard label={t("durationTitle")} value={durations} caption={durationCaption} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <EntityDetailPanel
            title={t("schedulePeriodic")}
            hint={t("scheduleLead")}
            icon={<Clock className="size-4" aria-hidden />}
            tone="sky"
            actions={
              groups.length > 0 || windowCount > 0 ? (
                <CountBadge label={t("scheduleCount", { groups: groups.length, windows: windowCount })} />
              ) : undefined
            }
          >
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("scheduleEmpty")}{" "}
                <Link href={editHref} className="font-medium text-sky-700 hover:underline">
                  {t("editDetail")}
                </Link>
              </p>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <DayGroup key={group.id ?? group.name} group={group} locale={locale} />
                ))}
              </div>
            )}
          </EntityDetailPanel>

          <EntityDetailPanel
            title={t("holidayCardTitle")}
            hint={t("holidayLead")}
            icon={<CalendarDays className="size-4" aria-hidden />}
            tone="sky"
            actions={
              holidayWindows.length > 0 ? (
                <CountBadge label={t("holidayCount", { count: holidayWindows.length })} />
              ) : undefined
            }
          >
            {holidayWindows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("holidayEmpty")}{" "}
                <Link href={editHref} className="font-medium text-sky-700 hover:underline">
                  {t("editDetail")}
                </Link>
              </p>
            ) : (
              <div>
                {holidayWindows.map((window) => (
                  <WindowRow
                    key={window.id ?? window.name}
                    starts={window.starts_at}
                    ends={window.ends_at}
                    name={window.name}
                    amount={window.amount === 0 ? t("freePrice") : `${formatAmount(locale, window.amount)} ${t("currencySuffix")}`}
                  />
                ))}
              </div>
            )}
          </EntityDetailPanel>

        </div>

        <EntityDetailPanel title={t("applyTitle")} hint={t("applyLead")} icon={<BadgeCheck className="size-4" aria-hidden />} tone="sky">
          <dl className="space-y-2 text-sm">
            <Fact label={t("branch")} value={branchName} />
            <Fact label={t("sport")} value={sportName} />
            <Fact label={t("customerType")} value={audience} />
            <Fact label={t("slotUnit")} value={t("minutes", { count: profile.slot_unit_minutes })} />
          </dl>
          <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
            {profile.published
              ? t("applyActive", { sport: sportName, audience })
              : t("applyDraft")}
          </p>
        </EntityDetailPanel>
      </div>

      <AlertDialog open={confirming} onOpenChange={(next) => { if (!next) setConfirming(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("activateTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("activateConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={activate.isPending}
              onClick={() => {
                setConfirming(false);
                void onActivate();
              }}
            >
              {t("activate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={testerOpen} onOpenChange={setTesterOpen}>
        <SheetContent side="right" className="flex h-full w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
          <SheetHeader className="space-y-0 border-b border-border px-4 py-3 pr-12">
            <SheetTitle className="text-base">{t("testPrice")}</SheetTitle>
            <SheetDescription className="sr-only">{t("testPrice")}</SheetDescription>
          </SheetHeader>
          <div className="p-4">
            {testerOpen ? (
              <PricingQuotePreview
                organizationId={organizationId}
                branchId={branchId}
                sportId={profile.sport_id}
                durations={profile.durations ?? []}
                customerType={profile.customer_type}
                slotUnitMinutes={profile.slot_unit_minutes}
                unlimited={profile.unlimited_duration}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DayGroup({
  group,
  locale,
}: {
  group: BranchPricingProfile["day_groups"][number];
  locale: string;
}) {
  const t = useTranslations("organization.branchDetail.pricing");
  const tw = useTranslations("organization.branchDetail.weekdaysShort");
  const windows = group.windows ?? [];
  const days = WEEKDAYS.filter((day) => (group.weekdays ?? []).includes(day));

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          {group.name?.trim() ? (
            <p className="text-sm font-medium text-foreground">{group.name}</p>
          ) : null}
          <div className={group.name?.trim() ? "mt-1 flex flex-wrap gap-1" : "flex flex-wrap gap-1"}>
            {days.map((day) => (
              <span
                key={day}
                className="rounded-md border border-primary bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
              >
                {tw(String(day))}
              </span>
            ))}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{t("windowsPerWeek", { count: windows.length })}</span>
      </div>
      <div>
        {windows.map((window) => (
          <WindowRow
            key={window.id ?? `${window.name}-${window.starts_at}`}
            starts={window.starts_at}
            ends={window.ends_at}
            name={window.name}
            amount={window.amount === 0 ? t("freePrice") : `${formatAmount(locale, window.amount)} ${t("currencySuffix")}`}
          />
        ))}
      </div>
    </section>
  );
}

function WindowRow({
  starts,
  ends,
  name,
  amount,
}: {
  starts: string;
  ends: string;
  name?: string;
  amount: string;
}) {
  const label = name?.trim();
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 border-t border-border/60 py-2 text-sm">
      <span className="tabular-nums text-muted-foreground">
        {clock(starts)}–{clock(ends)}
      </span>
      {label ? <span className="truncate text-foreground">{label}</span> : <span />}
      <span className="font-medium tabular-nums text-foreground">{amount}</span>
    </div>
  );
}

function StatCard({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div className="soft-elevated rounded-2xl p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
      {caption ? <p className="text-xs text-muted-foreground">{caption}</p> : null}
    </div>
  );
}

function CountBadge({ label }: { label: string }) {
  return <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{label}</span>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}
