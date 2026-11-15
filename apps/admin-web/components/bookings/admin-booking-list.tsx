"use client";

import { Card, CardContent, useUserDateTimePrefs } from "@bokdy/ui";
import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { useAdminBookingColumns } from "@/components/bookings/admin-booking-columns";
import { bookingFormatters } from "@/components/bookings/booking-format";
import { DATA_LIST_PAGE_SIZE, DataTable } from "@/components/data-list";
import { EntityAvatar, entityFileSrc } from "@/components/entity/avatar";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { Link } from "@/i18n/navigation";
import type { AdminBooking, AdminBookingStatus } from "@/lib/api/admin-bookings";

const BOOKING_STATUS_TONE = {
  pending: "amber",
  confirmed: "sky",
  checked_in: "emerald",
  in_progress: "emerald",
  completed: "muted",
  canceled: "rose",
} as const satisfies Record<AdminBookingStatus, "amber" | "sky" | "emerald" | "muted" | "rose">;

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
  emptyTitle?: string;
  mobileCards?: boolean;
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
  emptyTitle,
  mobileCards = false,
}: AdminBookingListProps) {
  const t = useTranslations("adminBookings");
  const tc = useTranslations("common");
  const td = useTranslations("dataList");
  const locale = useLocale();
  const prefs = useUserDateTimePrefs();
  const columns = useAdminBookingColumns(showOrganization);
  const [rowSelection, setRowSelection] = useState({});
  const format = bookingFormatters(locale, prefs);

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
      emptyTitle={emptyTitle ?? t("empty")}
      mobileList={
        mobileCards && rows.length > 0 ? (
          <div className="space-y-3 p-4">
            {rows.map((row) => (
              <Link
                key={row.id}
                href={`/organizations/${row.organization_id}/bookings/${row.id}`}
                className="block"
              >
                <Card className="soft-elevated border-border/40 shadow-none">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{row.booking_no}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.customer_name ?? t("none")}
                        </p>
                      </div>
                      <SoftStatusChip
                        label={t(`statusLabel.${row.status}`)}
                        tone={BOOKING_STATUS_TONE[row.status]}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format.when(row.starts_at)}
                      {" · "}
                      {format.money(row.total_amount)}
                    </p>
                    {row.branch_name ? (
                      <div className="flex min-w-0 items-center gap-2">
                        <EntityAvatar
                          name={row.branch_name}
                          size="sm"
                          src={entityFileSrc(row.branch_logo_file_id)}
                        />
                        <span className="truncate text-xs text-muted-foreground">{row.branch_name}</span>
                      </div>
                    ) : null}
                    {showOrganization && row.organization_name ? (
                      <div className="flex min-w-0 items-center gap-2">
                        <EntityAvatar
                          name={row.organization_name}
                          size="sm"
                          src={entityFileSrc(row.organization_logo_file_id)}
                        />
                        <span className="truncate text-xs text-muted-foreground">
                          {row.organization_name}
                        </span>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : undefined
      }
    />
  );
}
