"use client";

import { DatePicker, InputGroup, InputGroupAddon, InputGroupInput } from "@bokdy/ui";
import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PopoverCommandSelect } from "@/components/popover-command-select";
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
}: {
  q: string;
  status: string;
  from: string;
  to: string;
  onChange: (updates: { q?: string; status?: string; from?: string; to?: string }) => void;
}) {
  const t = useTranslations("adminBookings");
  const tc = useTranslations("common");
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-2 p-4 md:flex-row md:flex-wrap md:items-end">
      <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted-foreground">
        {t("search")}
        <InputGroup className="h-9">
          <InputGroupAddon align="inline-start">
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={q}
            onChange={(event) => onChange({ q: event.target.value })}
            aria-label={t("search")}
            autoComplete="off"
          />
        </InputGroup>
      </label>
      <label className="flex min-w-40 flex-col gap-1 text-xs text-muted-foreground">
        {t("status")}
        <PopoverCommandSelect
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
          aria-label={t("status")}
          searchable={false}
          align="start"
          className="w-full border border-input bg-background"
        />
      </label>
      <label className="flex min-w-40 flex-col gap-1 text-xs text-muted-foreground">
        {t("from")}
        <DatePicker
          value={from}
          onChange={(value) => onChange({ from: value })}
          locale={locale}
          placeholder={tc("pickDate")}
          aria-label={t("from")}
        />
      </label>
      <label className="flex min-w-40 flex-col gap-1 text-xs text-muted-foreground">
        {t("to")}
        <DatePicker
          value={to}
          onChange={(value) => onChange({ to: value })}
          locale={locale}
          placeholder={tc("pickDate")}
          aria-label={t("to")}
        />
      </label>
    </div>
  );
}
