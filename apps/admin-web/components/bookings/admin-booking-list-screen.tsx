"use client";

import { Suspense } from "react";

import { AdminBookingFilters } from "@/components/bookings/admin-booking-filters";
import { AdminBookingList } from "@/components/bookings/admin-booking-list";
import { useAdminBookingListController } from "@/components/bookings/use-admin-booking-list";
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
}: {
  pathname: string;
  showOrganization?: boolean;
  useList: (params: AdminBookingListParams) => BookingListQuery;
}) {
  return (
    <Suspense>
      <AdminBookingListScreenContent
        pathname={pathname}
        showOrganization={showOrganization}
        useList={useList}
      />
    </Suspense>
  );
}

function AdminBookingListScreenContent({
  pathname,
  showOrganization,
  useList,
}: {
  pathname: string;
  showOrganization: boolean;
  useList: (params: AdminBookingListParams) => BookingListQuery;
}) {
  const list = useAdminBookingListController(pathname);
  const query = useList(list.params);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AdminBookingFilters
        q={list.q}
        status={list.status}
        from={list.from}
        to={list.to}
        onChange={list.onFilterChange}
      />
      <AdminBookingList
        rows={query.data?.items ?? []}
        total={query.data?.total ?? 0}
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
    </div>
  );
}
