"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useUserDateTimePrefs } from "@bokdy/ui";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import { bookingFormatters } from "@/components/bookings/booking-format";
import { EntityRelationLink } from "@/components/entity/relation-link";
import {
  SoftStatusChip,
  type SoftStatusToneKey,
} from "@/components/entity/soft-status-chip";
import type { AdminBooking, AdminBookingStatus } from "@/lib/api/admin-bookings";

const BOOKING_STATUS_TONE: Record<AdminBookingStatus, SoftStatusToneKey> = {
  pending: "amber",
  confirmed: "sky",
  checked_in: "emerald",
  in_progress: "emerald",
  completed: "muted",
  canceled: "rose",
};

function namedRelation(name: string | null | undefined, href: string, empty: string) {
  const label = name?.trim();
  if (!label) return empty;
  return <EntityRelationLink href={href}>{label}</EntityRelationLink>;
}

export function useAdminBookingColumns(showOrganization: boolean) {
  const t = useTranslations("adminBookings");
  const locale = useLocale();
  const prefs = useUserDateTimePrefs();

  return useMemo<ColumnDef<AdminBooking, unknown>[]>(() => {
    const format = bookingFormatters(locale, prefs);
    const columns: ColumnDef<AdminBooking, unknown>[] = [
      {
        id: "booking_no",
        accessorKey: "booking_no",
        header: t("columns.bookingNo"),
        enableSorting: false,
        cell: ({ row }) => (
          <EntityRelationLink
            href={`/organizations/${row.original.organization_id}/bookings/${row.original.id}`}
          >
            {row.original.booking_no}
          </EntityRelationLink>
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
        cell: ({ row }) =>
          namedRelation(
            row.original.court_name,
            `/courts/${row.original.court_id}`,
            t("none"),
          ),
      },
      {
        id: "branch",
        accessorKey: "branch_name",
        header: t("columns.branch"),
        enableSorting: false,
        cell: ({ row }) =>
          namedRelation(
            row.original.branch_name,
            `/branches/${row.original.branch_id}`,
            t("none"),
          ),
      },
    ];
    if (showOrganization) {
      columns.push({
        id: "organization",
        accessorKey: "organization_name",
        header: t("columns.organization"),
        enableSorting: false,
        cell: ({ row }) =>
          namedRelation(
            row.original.organization_name,
            `/organizations/${row.original.organization_id}`,
            t("none"),
          ),
      });
    }
    columns.push(
      {
        id: "status",
        accessorKey: "status",
        header: t("columns.status"),
        cell: ({ row }) => (
          <SoftStatusChip
            label={t(`statusLabel.${row.original.status}`)}
            tone={BOOKING_STATUS_TONE[row.original.status]}
          />
        ),
      },
      {
        id: "total_amount",
        accessorKey: "total_amount",
        header: t("columns.total"),
        cell: ({ row }) => format.money(row.original.total_amount),
      },
    );
    return columns;
  }, [locale, prefs, showOrganization, t]);
}
