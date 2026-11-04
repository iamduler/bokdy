"use client";

import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useAdminBookingColumns } from "@/components/bookings/admin-booking-columns";
import { DATA_LIST_PAGE_SIZE, DataTable } from "@/components/data-list";
import type { AdminBooking } from "@/lib/api/admin-bookings";

type AdminBookingListProps = {
  rows: AdminBooking[];
  total: number;
  pageIndex: number;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  onPaginationChange: OnChangeFn<PaginationState>;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
  showOrganization?: boolean;
};

export function AdminBookingList({
  rows,
  total,
  pageIndex,
  sorting,
  onSortingChange,
  onPaginationChange,
  isLoading,
  isError,
  isFetching,
  onRetry,
  showOrganization = false,
}: AdminBookingListProps) {
  const t = useTranslations("adminBookings");
  const tc = useTranslations("common");
  const td = useTranslations("dataList");
  const columns = useAdminBookingColumns(showOrganization);
  const [rowSelection, setRowSelection] = useState({});

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      sorting={sorting}
      onSortingChange={onSortingChange}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      pagination={{ pageIndex, pageSize: DATA_LIST_PAGE_SIZE }}
      onPaginationChange={onPaginationChange}
      pageSize={DATA_LIST_PAGE_SIZE}
      manualPagination
      manualSorting
      rowCount={total}
      paginationLabels={{
        previous: td("previousPage"),
        next: td("nextPage"),
        summary: (params) => td("pageSummary", params),
      }}
      isLoading={isLoading}
      isError={isError}
      errorMessage={t("loadError")}
      onRetry={onRetry}
      retryLabel={isFetching ? tc("loading") : tc("retry")}
      emptyTitle={t("empty")}
    />
  );
}
