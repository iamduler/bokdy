"use client";

import { cn } from "@bokdy/ui";
import { Suspense, type ReactNode } from "react";

import { AdminBookingFilters } from "@/components/bookings/admin-booking-filters";
import { AdminBookingList } from "@/components/bookings/admin-booking-list";
import { useAdminBookingListController } from "@/components/bookings/use-admin-booking-list";
import { softDetailSectionGap } from "@/components/data-list";
import type { AdminBookingListParams, AdminBookingPage } from "@/lib/api/admin-bookings";

type BookingListQuery = {
  data?: AdminBookingPage;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => unknown;
};

export function AdminBookingListScreen({
  pathname,
  showOrganization = false,
  useList,
  header,
}: {
  pathname: string;
  showOrganization?: boolean;
  useList: (params: AdminBookingListParams) => BookingListQuery;
  /** When set, the list uses the organization section chrome instead of a full card. */
  header?: (total: number) => ReactNode;
}) {
  return (
    <Suspense>
      <AdminBookingListScreenContent
        pathname={pathname}
        showOrganization={showOrganization}
        useList={useList}
        header={header}
      />
    </Suspense>
  );
}

function AdminBookingListScreenContent({
  pathname,
  showOrganization,
  useList,
  header,
}: {
  pathname: string;
  showOrganization: boolean;
  useList: (params: AdminBookingListParams) => BookingListQuery;
  header?: (total: number) => ReactNode;
}) {
  const list = useAdminBookingListController(pathname);
  const query = useList(list.params);
  const total = query.data?.total ?? 0;
  const listView = (
    <AdminBookingList
      rows={query.data?.items ?? []}
      total={total}
      pageIndex={list.pageIndex}
      sorting={list.sorting}
      onSortingChange={list.onSortingChange}
      onPaginationChange={list.onPaginationChange}
      isLoading={query.isLoading}
      isError={query.isError}
      isFetching={query.isFetching}
      onRetry={() => void query.refetch()}
      showOrganization={showOrganization}
    />
  );

  if (header) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {header(total)}
        <AdminBookingFilters
          q={list.q}
          status={list.status}
          from={list.from}
          to={list.to}
          onChange={list.onFilterChange}
          className="px-4 py-3 md:px-6"
        />
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-y-auto soft-scrollbar p-4 pb-6 md:px-6",
            softDetailSectionGap,
          )}
        >
          <div className="soft-elevated flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border-0">
            {listView}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-6">
      <div className="soft-elevated flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border-0">
        <AdminBookingFilters
          q={list.q}
          status={list.status}
          from={list.from}
          to={list.to}
          onChange={list.onFilterChange}
        />
        {listView}
      </div>
    </div>
  );
}
