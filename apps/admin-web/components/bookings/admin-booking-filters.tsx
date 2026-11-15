"use client";

import { DatePicker, cn } from "@bokdy/ui";
import { useLocale, useTranslations } from "next-intl";

import { softFilterControl } from "@/components/data-list";
import { FilterSearchField } from "@/components/data-list/filter-search-field";
import { FilterSelect } from "@/components/data-list/filter-select";
import type { AdminBookingStatus } from "@/lib/api/admin-bookings";

const STATUSES: AdminBookingStatus[] = [
  "pending",
  "confirmed",
  "checked_in",
  "in_progress",
  "completed",
  "canceled",
];

export const ADMIN_BOOKING_STATUSES = new Set<AdminBookingStatus>(STATUSES);

export function AdminBookingFilters({
  q,
  status,
  from,
  to,
  onChange,
  className,
}: {
  q: string;
  status: string;
  from: string;
  to: string;
  onChange: (updates: { q?: string; status?: string; from?: string; to?: string }) => void;
  className?: string;
}) {
  const t = useTranslations("adminBookings");
  const locale = useLocale();
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-2 border-b border-border/40 px-4 py-3 md:px-6",
        className,
      )}
    >
      <FilterSearchField
        value={q}
        onChange={(value) => onChange({ q: value })}
        label={t("search")}
      />
      <FilterSelect
        value={status}
        onValueChange={(value) => onChange({ status: value })}
        options={[
          { value: "", label: t("statusAll"), keywords: t("statusAll") },
          ...STATUSES.map((item) => ({
            value: item,
            label: t(`statusLabel.${item}`),
            keywords: item,
          })),
        ]}
        ariaLabel={t("status")}
      />
      <DatePicker
        value={from}
        onChange={(value) => onChange({ from: value })}
        locale={locale}
        placeholder={t("from")}
        aria-label={t("from")}
        className={cn("h-8 w-auto min-w-36 font-medium", softFilterControl)}
      />
      <DatePicker
        value={to}
        onChange={(value) => onChange({ to: value })}
        locale={locale}
        placeholder={t("to")}
        aria-label={t("to")}
        className={cn("h-8 w-auto min-w-36 font-medium", softFilterControl)}
      />
    </div>
  );
}
