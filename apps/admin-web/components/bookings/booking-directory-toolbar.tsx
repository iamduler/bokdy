"use client";

import { Button, DatePicker, Field, FieldLabel, cn } from "@bokdy/ui";
import { CalendarCheck, CircleCheck, Clock, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { ADMIN_BOOKING_STATUSES } from "@/components/bookings/admin-booking-filters";
import { softFilterControl, type DataListStatItem, type DataListStatusTab } from "@/components/data-list";
import { DirectoryToolbar } from "@/components/data-list/directory-toolbar";
import { FilterSelect } from "@/components/data-list/filter-select";
import type { PopoverCommandOption } from "@/components/popover-command-select";
import { useAdminBranches } from "@/hooks/use-admin-branches";
import { useAdminOrganizations } from "@/hooks/use-admin-organizations";
import { useRouter } from "@/i18n/navigation";
import type { AdminBookingDirectoryStats, AdminBookingStatus } from "@/lib/api/admin-bookings";

const STATUSES = [...ADMIN_BOOKING_STATUSES] as AdminBookingStatus[];

const STATUS_DOT: Record<AdminBookingStatus, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-sky-500",
  checked_in: "bg-emerald-500",
  in_progress: "bg-emerald-500",
  completed: "bg-muted-foreground",
  canceled: "bg-rose-500",
};

export function BookingDirectoryToolbar({
  q,
  status,
  from,
  to,
  organizationId,
  branchId,
  stats,
  statsLoading,
  children,
}: {
  q: string;
  status: AdminBookingStatus | "";
  from: string;
  to: string;
  organizationId: string;
  branchId: string;
  stats: AdminBookingDirectoryStats | undefined;
  statsLoading?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("adminBookings");
  const td = useTranslations("dataList");
  const locale = useLocale();
  const { data: organizations } = useAdminOrganizations({ limit: 100, sort: "name", order: "asc" });
  const { data: branches } = useAdminBranches({
    limit: 100,
    sort: "name",
    order: "asc",
    organization_id: organizationId || undefined,
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(q);
  const total = stats?.total ?? 0;
  const pending = stats?.pending ?? 0;
  const confirmed = stats?.confirmed ?? 0;
  const completed = stats?.completed ?? 0;

  useEffect(() => {
    setSearch(q);
  }, [q]);

  const replaceParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.delete("offset");
      const qs = params.toString();
      router.replace(qs ? `/bookings?${qs}` : "/bookings");
    },
    [router, searchParams],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = search.trim();
      if (trimmed === q.trim()) return;
      replaceParams({ q: trimmed || undefined });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, q, replaceParams]);

  const organizationOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: "", label: t("filterAll"), keywords: t("filterAll") },
      ...(organizations?.items ?? []).map((org) => ({
        value: org.id,
        label: org.name,
        keywords: `${org.code} ${org.name}`,
      })),
    ],
    [organizations, t],
  );
  const branchOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: "", label: t("filterAll"), keywords: t("filterAll") },
      ...(branches?.items ?? []).map((branch) => ({
        value: branch.id,
        label: branch.name,
        keywords: `${branch.code} ${branch.name}`,
      })),
    ],
    [branches, t],
  );

  const kpi = useMemo<DataListStatItem[]>(
    () => [
      {
        key: "total",
        label: t("kpiTotal"),
        value: total,
        icon: <CalendarCheck className="size-4" aria-hidden />,
        iconTone: "sky",
      },
      {
        key: "pending",
        label: t("kpiPending"),
        value: pending,
        icon: <Clock className="size-4" aria-hidden />,
        iconTone: "amber",
      },
      {
        key: "confirmed",
        label: t("kpiConfirmed"),
        value: confirmed,
        icon: <ShieldCheck className="size-4" aria-hidden />,
        iconTone: "emerald",
      },
      {
        key: "completed",
        label: t("kpiCompleted"),
        value: completed,
        icon: <CircleCheck className="size-4" aria-hidden />,
        iconTone: "emerald",
      },
    ],
    [completed, confirmed, pending, t, total],
  );

  const counts: Record<AdminBookingStatus, number | undefined> = {
    pending,
    confirmed,
    checked_in: stats?.checked_in,
    in_progress: stats?.in_progress,
    completed,
    canceled: stats?.canceled,
  };

  const statusTabs = useMemo<DataListStatusTab[]>(
    () => [
      { value: "", label: t("statusAll"), count: total },
      ...STATUSES.map((item) => ({
        value: item,
        label: t(`statusLabel.${item}`),
        dotClass: STATUS_DOT[item],
        count: counts[item],
      })),
    ],
    [counts, t, total],
  );

  const advancedCount =
    Number(Boolean(from)) +
    Number(Boolean(to)) +
    Number(Boolean(organizationId)) +
    Number(Boolean(branchId));
  const hasAdvancedFilters = advancedCount > 0;

  function clearAdvanced() {
    replaceParams({
      from: undefined,
      to: undefined,
      organization_id: undefined,
      branch_id: undefined,
    });
  }

  return (
    <DirectoryToolbar
      title={t("directoryTitle")}
      stats={kpi}
      statsLoading={statsLoading}
      statusTabs={statusTabs}
      statusValue={status}
      onStatusChange={(value) => replaceParams({ status: value || undefined })}
      statusAriaLabel={t("status")}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t("directorySearch")}
      advancedLabel={td("advancedFilters")}
      advancedClassName="w-80"
      hasAdvancedFilters={hasAdvancedFilters}
      advancedFilterCount={advancedCount}
      onClearFilters={hasAdvancedFilters ? clearAdvanced : undefined}
      clearLabel={t("clear")}
      advancedContent={
        <div className="space-y-3">
          <Field>
            <FieldLabel>{t("columns.organization")}</FieldLabel>
            <FilterSelect
              value={organizationId}
              onValueChange={(value) =>
                replaceParams({ organization_id: value || undefined, branch_id: undefined })
              }
              options={organizationOptions}
              ariaLabel={t("columns.organization")}
              placeholder={t("filterAll")}
              searchPlaceholder={t("filterSearch")}
              emptyText={t("filterEmpty")}
              searchable
              className="w-full"
            />
          </Field>
          <Field>
            <FieldLabel>{t("columns.branch")}</FieldLabel>
            <FilterSelect
              value={branchId}
              onValueChange={(value) => replaceParams({ branch_id: value || undefined })}
              options={branchOptions}
              ariaLabel={t("columns.branch")}
              placeholder={t("filterAll")}
              searchPlaceholder={t("filterSearch")}
              emptyText={t("filterEmpty")}
              searchable
              className="w-full"
            />
          </Field>
          <Field>
            <FieldLabel>{t("from")}</FieldLabel>
            <DatePicker
              value={from}
              onChange={(value) => replaceParams({ from: value || undefined })}
              locale={locale}
              placeholder={t("from")}
              aria-label={t("from")}
              className={cn("h-8 w-full font-medium", softFilterControl)}
            />
          </Field>
          <Field>
            <FieldLabel>{t("to")}</FieldLabel>
            <DatePicker
              value={to}
              onChange={(value) => replaceParams({ to: value || undefined })}
              locale={locale}
              placeholder={t("to")}
              aria-label={t("to")}
              className={cn("h-8 w-full font-medium", softFilterControl)}
            />
          </Field>
          {hasAdvancedFilters ? (
            <Button type="button" variant="ghost" size="sm" className="w-full rounded-full" onClick={clearAdvanced}>
              {t("clear")}
            </Button>
          ) : null}
        </div>
      }
    >
      {children}
    </DirectoryToolbar>
  );
}
