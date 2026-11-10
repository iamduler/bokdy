"use client";

import { Button, DatePicker, FieldLabel, TimePicker } from "@bokdy/ui";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { InfoHint } from "@/components/info-hint";
import { PopoverCommandSelect } from "@/components/popover-command-select";
import { useBranchCourts } from "@/hooks/use-courts";
import { useBranchPricingProfiles } from "@/hooks/use-pricing";
import { calculatePrice, type PriceQuote } from "@/lib/api/pricing";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import { CUSTOMER_TYPES, durationChoices } from "@/lib/validation/branch-pricing";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(amount);
}

function ictClock(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

function ictRange(date: string, time: string, durationMin: number) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, hour - 7, minute));
  const end = new Date(start.getTime() + durationMin * 60_000);
  return { starts_at: start.toISOString(), ends_at: end.toISOString() };
}

export function PricingQuotePreview({
  organizationId,
  branchId,
  sportId,
  durations,
  customerType,
  slotUnitMinutes,
  unlimited = false,
}: {
  organizationId: string;
  branchId: string;
  sportId: string;
  durations: number[];
  customerType: "walk_in" | "member" | "vip";
  slotUnitMinutes: number;
  unlimited?: boolean;
}) {
  const t = useTranslations("organization.branchDetail.pricing");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const locale = useLocale();
  const courts = useBranchCourts(organizationId, branchId);
  const lists = useBranchPricingProfiles(organizationId, branchId);
  const matching = useMemo(
    () => (courts.data ?? []).filter((court) => court.sport_id === sportId),
    [courts.data, sportId],
  );
  const [audience, setAudience] = useState(customerType);
  const [courtId, setCourtId] = useState("");
  const [date, setDate] = useState("2026-11-05");
  const [start, setStart] = useState("15:30");
  const [duration, setDuration] = useState(durations[0] ?? 60);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const selectedCourt = courtId || matching[0]?.id || "";
  const quoted = useMemo(() => {
    const profiles = (lists.data ?? []).flatMap((group) => group.profiles);
    const sameAudience = profiles.filter(
      (profile) => profile.sport_id === sportId && profile.customer_type === audience,
    );
    return sameAudience.find((profile) => profile.published) ?? sameAudience[0];
  }, [audience, lists.data, sportId]);
  const durationOptions = useMemo(() => {
    const slot = quoted?.slot_unit_minutes || slotUnitMinutes || 60;
    const allowed = quoted?.durations ?? durations;
    const unlimitedQuote = quoted ? quoted.unlimited_duration : unlimited;
    if (!unlimitedQuote && allowed.length > 0) return allowed;
    return durationChoices(slot);
  }, [durations, quoted, slotUnitMinutes, unlimited]);
  const selectedDuration = durationOptions.includes(duration) ? duration : (durationOptions[0] ?? 60);

  async function run() {
    if (!sportId) {
      setError(t("previewNeedSport"));
      return;
    }
    if (!selectedCourt) {
      setError(t("previewEmptyCourts"));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start) || selectedDuration <= 0) {
      setError(t("issueClock"));
      return;
    }
    setPending(true);
    setError("");
    try {
      const range = ictRange(date, start, selectedDuration);
      setQuote(
        await calculatePrice({
          court_id: selectedCourt,
          customer_type: audience,
          ...range,
        }),
      );
    } catch (err) {
      setQuote(null);
      setError(quoteErrorMessage(err, t, te));
    } finally {
      setPending(false);
    }
  }

  const amountLabel = (amount: number) =>
    amount === 0 ? t("freePrice") : `${formatAmount(amount)} ${t("currencySuffix")}`;

  return (
    <section id="pricing-preview" className="space-y-3">
      <div className="flex items-center gap-1.5">
        <h3 className="text-sm font-semibold text-foreground">{t("previewTitle")}</h3>
        <InfoHint text={t("previewHint")} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <FieldLabel>{t("customerType")}</FieldLabel>
          <PopoverCommandSelect
            value={audience}
            onValueChange={(value) => {
              setAudience(value as (typeof CUSTOMER_TYPES)[number]);
              setQuote(null);
            }}
            options={CUSTOMER_TYPES.map((type) => ({
              value: type,
              label: t(`audience.${type}`),
              keywords: t(`audience.${type}`),
            }))}
            aria-label={t("customerType")}
            searchable={false}
            className="w-full border border-input bg-background"
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>{t("previewCourt")}</FieldLabel>
          <PopoverCommandSelect
            value={selectedCourt}
            onValueChange={setCourtId}
            options={matching.map((court) => ({
              value: court.id,
              label: court.name,
              keywords: court.name,
            }))}
            placeholder={matching.length === 0 ? t("previewEmptyCourts") : t("previewCourt")}
            aria-label={t("previewCourt")}
            searchable={false}
            className="w-full border border-input bg-background"
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel htmlFor="pricing-preview-date">{t("previewDate")}</FieldLabel>
          <DatePicker
            id="pricing-preview-date"
            value={date}
            onChange={setDate}
            locale={locale}
            placeholder={tc("pickDate")}
            aria-label={t("previewDate")}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel htmlFor="pricing-preview-start">{t("previewStart")}</FieldLabel>
          <TimePicker
            id="pricing-preview-start"
            value={start}
            onChange={setStart}
            placeholder={tc("pickTime")}
            hourLabel={tc("hour")}
            minuteLabel={tc("minute")}
            aria-label={t("previewStart")}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>{t("previewDuration")}</FieldLabel>
          <PopoverCommandSelect
            value={String(selectedDuration)}
            onValueChange={(value) => {
              setDuration(Number(value));
              setQuote(null);
            }}
            options={durationOptions.map((minutes) => ({
              value: String(minutes),
              label: t("minutes", { count: minutes }),
              keywords: String(minutes),
            }))}
            aria-label={t("previewDuration")}
            searchable={false}
            className="w-full border border-input bg-background"
          />
        </div>
      </div>
      <Button type="button" variant="outline" disabled={pending} onClick={() => void run()}>
        {t("previewRun")}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {quote ? (
        <div className="space-y-1 text-sm">
          <p className="font-medium">
            {t("previewTotal")} · {t(`audience.${audience}`)}: {amountLabel(quote.total_amount)}
          </p>
          <ul className="space-y-0.5 text-muted-foreground">
            {(quote.lines ?? []).map((line) => (
              <li key={`${line.starts_at}-${line.ends_at}`}>
                {ictClock(line.starts_at)}–{ictClock(line.ends_at)}
                {" · "}
                {line.window_name || (line.rule_id ? t("previewRuleLine") : t("previewBaseLine"))}
                {" · "}
                {amountLabel(line.amount)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function quoteErrorMessage(
  err: unknown,
  t: (key: string) => string,
  te: (key: string) => string,
) {
  if (!(err instanceof ApiError)) return t("loadError");
  if (err.message.includes("multiple of the slot")) return t("previewDurationSlot");
  if (err.message.includes("not allowed")) return t("previewDurationNotAllowed");
  if (err.message.includes("align to the slot")) return t("previewStartAlign");
  return te(errorMessageKey(err));
}
