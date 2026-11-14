"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI user detail
 */

import {
  cn,
  formatUserDate,
  formatUserDateTime,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useUserDateTimePrefs,
} from "@bokdy/ui";
import {
  CalendarCheck,
  IdCard,
  MapPin,
  Receipt,
  RotateCcw,
  Shield,
  SlidersHorizontal,
  UserRound,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { DataListStats, softContentMaxW } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { useUserDetail } from "@/components/users/detail/user-detail-context";
import { UserSecurityActions } from "@/components/users/detail/user-security-view";
import { usePlayerSummary } from "@/hooks/use-admin-users";
import { useProvinces, useWards } from "@/hooks/use-admin-units";
import { useCountries } from "@/hooks/use-countries";
import { useLocales } from "@/hooks/use-locales";
import { timezoneLabel } from "@/lib/time-zones";

const genders = ["male", "female", "other", "undisclosed"] as const;
const themes = ["light", "dark", "system"] as const;
const dateFormats = ["dmy", "mdy", "ymd"] as const;

function shown(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed || "—";
}

function optionLabel(
  value: string | undefined,
  allowed: readonly string[],
  label: (key: string) => string,
) {
  if (!value || !allowed.includes(value)) return "—";
  return label(value);
}

function formatSpendMinor(
  minor: number | undefined,
  currency: string | undefined,
  locale: string,
) {
  if (minor == null) return "—";
  const code = (currency || "VND").toUpperCase();
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(minor);
  } catch {
    return `${minor} ${code}`;
  }
}

function VerificationChip({
  verified,
  verifiedAt,
  verifiedLabel,
  unverifiedLabel,
  prefs,
}: {
  verified: boolean;
  verifiedAt?: string | null;
  verifiedLabel: string;
  unverifiedLabel: string;
  prefs: ReturnType<typeof useUserDateTimePrefs>;
}) {
  if (verified) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <SoftStatusChip label={verifiedLabel} tone="emerald" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {verifiedAt ? formatUserDateTime(verifiedAt, prefs) : verifiedLabel}
        </TooltipContent>
      </Tooltip>
    );
  }
  return <SoftStatusChip label={unverifiedLabel} tone="muted" />;
}

export function UserOverviewView() {
  const t = useTranslations("users.overview");
  const tf = useTranslations("users.accountForm");
  const tu = useTranslations("users");
  const ts = useTranslations("users.security");
  const locale = useLocale();
  const prefs = useUserDateTimePrefs();
  const { user, audience, userId } = useUserDetail();
  const summary = usePlayerSummary(audience === "players" ? userId : "");
  const locales = useLocales();
  const countries = useCountries();
  const provinces = useProvinces("current_v2");
  const wards = useWards({ scheme: "current_v2", provinceId: user.province_id || undefined });
  const email = user.email?.trim() ?? "";
  const phone = user.phone?.trim() ?? "";
  const emailVerified = Boolean(user.email_verified_at);
  const phoneVerified = Boolean(user.phone_verified_at);
  const localeName = locales.data?.find((item) => item.id === user.locale_id);
  const countryName = countries.data?.find((item) => item.id === user.country_id);
  const provinceName = provinces.data?.find((item) => item.id === user.province_id)?.name;
  const wardName = wards.data?.find((item) => item.id === user.ward_id)?.name;

  const contact: { label: string; value: ReactNode }[] = [
    {
      label: t("email"),
      value: email ? (
        <div className="space-y-1.5">
          <p className="min-w-0 break-all">{email}</p>
          <VerificationChip
            verified={emailVerified}
            verifiedAt={user.email_verified_at}
            verifiedLabel={tu("verified")}
            unverifiedLabel={tu("unverified")}
            prefs={prefs}
          />
        </div>
      ) : (
        "—"
      ),
    },
    {
      label: t("phone"),
      value: phone ? (
        <div className="space-y-1.5">
          <p className="min-w-0 break-all">{phone}</p>
          <VerificationChip
            verified={phoneVerified}
            verifiedAt={user.phone_verified_at}
            verifiedLabel={tu("verified")}
            unverifiedLabel={tu("unverified")}
            prefs={prefs}
          />
        </div>
      ) : (
        "—"
      ),
    },
    {
      label: t("created"),
      value: user.created_at ? formatUserDateTime(user.created_at, prefs) : "—",
    },
    {
      label: t("lastLogin"),
      value: user.last_login_at ? formatUserDateTime(user.last_login_at, prefs) : "—",
    },
  ];
  const personal: { label: string; value: ReactNode }[] = [
    { label: t("lastName"), value: shown(user.last_name) },
    { label: t("firstName"), value: shown(user.first_name) },
    { label: t("fullName"), value: shown(user.full_name) },
    {
      label: t("gender"),
      value: optionLabel(user.gender, genders, (key) => tf(`genderOptions.${key}`)),
    },
    {
      label: t("dateOfBirth"),
      value: user.date_of_birth ? formatUserDate(user.date_of_birth, prefs) : "—",
    },
  ];
  const preferences: { label: string; value: ReactNode }[] = [
    { label: t("locale"), value: shown(localeName?.native_name || localeName?.name) },
    { label: t("timezone"), value: user.timezone?.trim() ? timezoneLabel(user.timezone) : "—" },
    { label: t("country"), value: shown(countryName?.name) },
    { label: t("currency"), value: shown(user.preferred_currency_code) },
    {
      label: t("theme"),
      value: optionLabel(user.theme, themes, (key) => tf(`themeOptions.${key}`)),
    },
    {
      label: t("dateFormat"),
      value: optionLabel(user.date_format, dateFormats, (key) => tf(`dateFormatOptions.${key}`)),
    },
  ];
  const address: { label: string; value: ReactNode }[] = [
    { label: t("province"), value: shown(provinceName) },
    { label: t("ward"), value: shown(wardName) },
    { label: t("addressLine"), value: shown(user.address_line) },
  ];

  const spendCurrency =
    summary.data?.currency_code || user.preferred_currency_code || undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto soft-scrollbar p-4 md:p-6">
      <div className={cn("mx-auto flex w-full flex-col gap-4", softContentMaxW)}>
        {user.status === "suspended" ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="font-semibold text-destructive">{t("suspendedNotice")}</p>
            {user.suspend_reason?.trim() ? (
              <p className="mt-2 text-destructive/90">
                <span className="font-medium">{t("suspendReason")}: </span>
                {user.suspend_reason.trim()}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <ProfilePanel
            title={t("contact")}
            hint={t("hints.contact")}
            icon={<UserRound className="size-4" aria-hidden />}
            tone="sky"
            fields={contact}
          />
          <ProfilePanel
            title={t("personal")}
            hint={t("hints.personal")}
            icon={<IdCard className="size-4" aria-hidden />}
            tone="emerald"
            fields={personal}
          />
          <ProfilePanel
            title={t("preferences")}
            hint={t("hints.preferences")}
            icon={<SlidersHorizontal className="size-4" aria-hidden />}
            tone="amber"
            fields={preferences}
          />
          <ProfilePanel
            title={t("address")}
            hint={t("hints.address")}
            icon={<MapPin className="size-4" aria-hidden />}
            tone="sky"
            fields={address}
          />
        </div>

        {audience === "players" ? (
          <EntityDetailPanel
            title={ts("dangerZone")}
            hint={t("hints.security")}
            icon={<Shield className="size-4" aria-hidden />}
            tone="rose"
          >
            <div className="mt-3">
              <UserSecurityActions />
            </div>
          </EntityDetailPanel>
        ) : null}

        {audience === "players" ? (
          <DataListStats
            isLoading={summary.isLoading}
            items={[
              {
                key: "bookings",
                label: t("bookings"),
                value: summary.data?.booking_count ?? "—",
                icon: <CalendarCheck className="size-4" aria-hidden />,
                iconTone: "sky",
              },
              {
                key: "transactions",
                label: t("transactions"),
                value: summary.data?.transaction_count ?? "—",
                icon: <Receipt className="size-4" aria-hidden />,
                iconTone: "amber",
              },
              {
                key: "refunds",
                label: t("refunds"),
                value: summary.data?.refund_count ?? "—",
                icon: <RotateCcw className="size-4" aria-hidden />,
                iconTone: "rose",
              },
              {
                key: "spend",
                label: t("spend"),
                value: formatSpendMinor(summary.data?.total_spend_minor, spendCurrency, locale),
                icon: <Wallet className="size-4" aria-hidden />,
                iconTone: "emerald",
              },
            ]}
          />
        ) : null}
      </div>
    </div>
  );
}

function ProfilePanel({
  title,
  hint,
  icon,
  tone,
  fields,
}: {
  title: string;
  hint?: string;
  icon: ReactNode;
  tone: "sky" | "emerald" | "amber";
  fields: { label: string; value: ReactNode }[];
}) {
  return (
    <EntityDetailPanel title={title} hint={hint} icon={icon} tone={tone}>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <ProfileRow key={field.label} label={field.label} value={field.value} />
        ))}
      </div>
    </EntityDetailPanel>
  );
}

function ProfileRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}
