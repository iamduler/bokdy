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
  embedded = false,
}: {
  q: string;
  status: string;
  from: string;
  to: string;
  onChange: (updates: { q?: string; status?: string; from?: string; to?: string }) => void;
  className?: string;
  /** Detail panel: search full width, remaining filters in a 2-column grid below sm. */
  embedded?: boolean;
}) {
  const t = useTranslations("adminBookings");
  const locale = useLocale();
  const searchClass = embedded ? "w-full min-w-0 sm:w-auto sm:min-w-[12rem] sm:flex-1" : undefined;
  const selectClass = embedded ? "w-full min-w-0 sm:w-auto sm:min-w-[8.5rem]" : undefined;
  const dateClass = cn(
    "h-8 font-medium",
    embedded ? "w-full min-w-0 sm:w-auto sm:min-w-36" : "w-auto min-w-36",
    softFilterControl,
  );
  const search = (
    <FilterSearchField
      value={q}
      onChange={(value) => onChange({ q: value })}
      label={t("search")}
      className={searchClass}
    />
  );
  const controls = (
    <>
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
        className={selectClass}
      />
      <DatePicker
        value={from}
        onChange={(value) => onChange({ from: value })}
        locale={locale}
        placeholder={t("from")}
        aria-label={t("from")}
        className={dateClass}
      />
      <DatePicker
        value={to}
        onChange={(value) => onChange({ to: value })}
        locale={locale}
        placeholder={t("to")}
        aria-label={t("to")}
        className={dateClass}
      />
    </>
  );
  if (embedded) {
    return (
      <div className={cn("flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", className)}>
        {search}
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">{controls}</div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-2 border-b border-border/40 px-4 py-3 md:px-6",
        className,
      )}
    >
      {search}
      {controls}
    </div>
  );
}
