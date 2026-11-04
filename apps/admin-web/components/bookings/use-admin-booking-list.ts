"use client";

import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { ADMIN_BOOKING_STATUSES } from "@/components/bookings/admin-booking-filters";
import { DATA_LIST_PAGE_SIZE } from "@/components/data-list";
import { useRouter } from "@/i18n/navigation";
import type { AdminBookingListParams, AdminBookingStatus } from "@/lib/api/admin-bookings";
import { bookingDateFrom, bookingDateTo } from "@/lib/api/admin-bookings";
import {
  applySearchUpdates,
  queryFromSorting,
  readListPage,
  sortingFromQuery,
} from "@/lib/api/list-page";

const ADMIN_BOOKING_SORTS = new Set(["starts_at", "status", "created_at", "total_amount"]);

const ADMIN_BOOKING_SORT_BY_COLUMN: Record<string, string> = {
  starts_at: "starts_at",
  status: "status",
  total_amount: "total_amount",
};

const ADMIN_BOOKING_COLUMN_BY_SORT: Record<string, string> = {
  starts_at: "starts_at",
  status: "status",
  total_amount: "total_amount",
};

export function useAdminBookingListController(pathname: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const statusRaw = searchParams.get("status") ?? "";
  const status = ADMIN_BOOKING_STATUSES.has(statusRaw as AdminBookingStatus)
    ? (statusRaw as AdminBookingStatus)
    : "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const page = readListPage(searchParams, DATA_LIST_PAGE_SIZE);
  const sort = ADMIN_BOOKING_SORTS.has(page.sort) ? page.sort : undefined;
  const order = sort ? (page.order ?? "desc") : undefined;

  const replaceListParams = useCallback(
    (updates: Record<string, string | undefined>, resetOffset = false) => {
      const qs = applySearchUpdates(searchParams, updates, resetOffset);
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const params: AdminBookingListParams = {
    q: q.trim() || undefined,
    status: status || undefined,
    from: bookingDateFrom(from),
    to: bookingDateTo(to),
    limit: DATA_LIST_PAGE_SIZE,
    offset: page.offset,
    sort,
    order,
  };
  const sorting = sortingFromQuery(sort ?? "", order, ADMIN_BOOKING_COLUMN_BY_SORT);

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const query = queryFromSorting(next, ADMIN_BOOKING_SORT_BY_COLUMN);
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

  return {
    q,
    status,
    from,
    to,
    pageIndex: page.pageIndex,
    params,
    sorting,
    onSortingChange,
    onPaginationChange,
    onFilterChange: (updates: { q?: string; status?: string; from?: string; to?: string }) =>
      replaceListParams(
        {
          q: "q" in updates ? updates.q : q,
          status: "status" in updates ? updates.status : status,
          from: "from" in updates ? updates.from : from,
          to: "to" in updates ? updates.to : to,
        },
        true,
      ),
  };
}
