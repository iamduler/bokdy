"use client";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@bokdy/ui";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

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

const fieldClass =
  "h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground";

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
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        {t("status")}
        <select
          value={status}
          onChange={(event) => onChange({ status: event.target.value })}
          className={fieldClass}
        >
          <option value="">{t("statusAll")}</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {t(`statusLabel.${item}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        {t("from")}
        <input
          type="date"
          value={from}
          onChange={(event) => onChange({ from: event.target.value })}
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        {t("to")}
        <input
          type="date"
          value={to}
          onChange={(event) => onChange({ to: event.target.value })}
          className={fieldClass}
        />
      </label>
    </div>
  );
}
