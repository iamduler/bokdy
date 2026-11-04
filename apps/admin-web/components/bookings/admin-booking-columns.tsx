"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import { bookingFormatters } from "@/components/bookings/booking-format";
import { Link } from "@/i18n/navigation";
import type { AdminBooking } from "@/lib/api/admin-bookings";

export function useAdminBookingColumns(showOrganization: boolean) {
  const t = useTranslations("adminBookings");
  const locale = useLocale();

  return useMemo<ColumnDef<AdminBooking, unknown>[]>(() => {
    const format = bookingFormatters(locale);
    const columns: ColumnDef<AdminBooking, unknown>[] = [
      {
        id: "booking_no",
        accessorKey: "booking_no",
        header: t("columns.bookingNo"),
        enableSorting: false,
        cell: ({ row }) => (
          <Link
            href={`/organizations/${row.original.organization_id}/bookings/${row.original.id}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {row.original.booking_no}
          </Link>
        ),
      },
      {
        id: "customer",
        accessorKey: "customer_name",
        header: t("columns.customer"),
        enableSorting: false,
        cell: ({ row }) => row.original.customer_name ?? t("none"),
      },
      {
        id: "starts_at",
        accessorKey: "starts_at",
        header: t("columns.when"),
        cell: ({ row }) => format.when(row.original.starts_at),
      },
      {
        id: "court",
        accessorKey: "court_name",
        header: t("columns.court"),
        enableSorting: false,
        cell: ({ row }) => row.original.court_name ?? t("none"),
      },
      {
        id: "branch",
        accessorKey: "branch_name",
        header: t("columns.branch"),
        enableSorting: false,
        cell: ({ row }) => row.original.branch_name ?? t("none"),
      },
    ];
    if (showOrganization) {
      columns.push({
        id: "organization",
        accessorKey: "organization_name",
        header: t("columns.organization"),
        enableSorting: false,
      });
    }
    columns.push(
      {
        id: "status",
        accessorKey: "status",
        header: t("columns.status"),
        cell: ({ row }) => t(`statusLabel.${row.original.status}`),
      },
      {
        id: "total_amount",
        accessorKey: "total_amount",
        header: t("columns.total"),
        cell: ({ row }) => format.money(row.original.total_amount),
      },
    );
    return columns;
  }, [locale, showOrganization, t]);
}
