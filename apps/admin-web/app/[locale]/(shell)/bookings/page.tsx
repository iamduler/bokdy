"use client";

import { Spinner } from "@bokdy/ui";
import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";

import { ADMIN_BOOKING_STATUSES } from "@/components/bookings/admin-booking-filters";
import { AdminBookingList } from "@/components/bookings/admin-booking-list";
import { BookingDirectoryToolbar } from "@/components/bookings/booking-directory-toolbar";
import { DATA_LIST_PAGE_SIZE } from "@/components/data-list";
import { usePageShellTitle } from "@/components/shell/shell-title";
import {
  useAdminBookingDirectory,
  useAdminBookingDirectoryStats,
} from "@/hooks/use-admin-bookings";
import { useRouter } from "@/i18n/navigation";
import {
  bookingDateFrom,
  bookingDateTo,
  type AdminBookingStatus,
} from "@/lib/api/admin-bookings";
import {
  applySearchUpdates,
  queryFromSorting,
  readListPage,
  sortingFromQuery,
} from "@/lib/api/list-page";

const SORTS = new Set(["starts_at", "status", "created_at", "total_amount"]);
const SORT_BY_COLUMN: Record<string, string> = {
  starts_at: "starts_at",
  status: "status",
  total_amount: "total_amount",
};
const COLUMN_BY_SORT: Record<string, string> = {
  starts_at: "starts_at",
  status: "status",
  total_amount: "total_amount",
};

function parseStatus(raw: string | null): AdminBookingStatus | "" {
  if (!raw) return "";
  return ADMIN_BOOKING_STATUSES.has(raw as AdminBookingStatus)
    ? (raw as AdminBookingStatus)
    : "";
}

function BookingsPageContent() {
  const ts = useTranslations("shell");
  const t = useTranslations("adminBookings");
  usePageShellTitle(ts("pageTitles.bookings"));
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const status = parseStatus(searchParams.get("status"));
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const organizationId = searchParams.get("organization_id") ?? "";
  const branchId = searchParams.get("branch_id") ?? "";
  const hasFilters = Boolean(q.trim() || status || from || to || organizationId || branchId);
  const page = readListPage(searchParams, DATA_LIST_PAGE_SIZE);
  const sort = SORTS.has(page.sort) ? page.sort : undefined;
  const order = sort ? (page.order ?? "desc") : undefined;

  const replaceListParams = useCallback(
    (updates: Record<string, string | undefined>, resetOffset = false) => {
      const qs = applySearchUpdates(searchParams, updates, resetOffset);
      router.replace(qs ? `/bookings?${qs}` : "/bookings");
    },
    [router, searchParams],
  );

  const params = {
    q: q.trim() || undefined,
    status: status || undefined,
    from: bookingDateFrom(from),
    to: bookingDateTo(to),
    organization_id: organizationId || undefined,
    branch_id: branchId || undefined,
    limit: DATA_LIST_PAGE_SIZE,
    offset: page.offset,
    sort,
    order,
  };
  const { data, isLoading, isError, refetch, isFetching } = useAdminBookingDirectory(params);
  const statsQuery = useAdminBookingDirectoryStats({
    q: params.q,
    from: params.from,
    to: params.to,
    organization_id: organizationId || undefined,
    branch_id: branchId || undefined,
  });
  const sorting = sortingFromQuery(sort ?? "", order, COLUMN_BY_SORT);

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const query = queryFromSorting(next, SORT_BY_COLUMN);
    replaceListParams({ sort: query.sort, order: query.order }, true);
  };
  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next =
      typeof updater === "function"
        ? updater({ pageIndex: page.pageIndex, pageSize: DATA_LIST_PAGE_SIZE })
        : updater;
    const offset = next.pageIndex * DATA_LIST_PAGE_SIZE;
    replaceListParams({ offset: offset > 0 ? String(offset) : undefined });
  };

  return (
    <div className="flex min-h-full flex-col overflow-hidden">
      <BookingDirectoryToolbar
        q={q}
        status={status}
        from={from}
        to={to}
        organizationId={organizationId}
        branchId={branchId}
        stats={statsQuery.data}
        statsLoading={statsQuery.isLoading}
      >
        <AdminBookingList
          rows={data?.items ?? []}
          total={data?.total ?? 0}
          pageIndex={page.pageIndex}
          sorting={sorting}
          onSortingChange={onSortingChange}
          onPaginationChange={onPaginationChange}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          onRetry={() => void refetch()}
          showOrganization
          mobileCards
          emptyTitle={hasFilters ? t("emptyFilter") : t("empty")}
        />
      </BookingDirectoryToolbar>
    </div>
  );
}

export default function BookingsPage() {
  const tc = useTranslations("common");
  return (
    <Suspense
      fallback={
        <p className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <Spinner />
          {tc("loading")}
        </p>
      }
    >
      <BookingsPageContent />
    </Suspense>
  );
}
