"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { CourtArchiveButton } from "@/components/courts/court-archive-button";
import { COURT_STATUS_TONE } from "@/components/courts/court-status";
import { createSelectionColumn } from "@/components/data-list";
import { DirectoryIdentityCell } from "@/components/data-list/directory-identity-cell";
import { entityFileSrc } from "@/components/entity/avatar";
import { RowEditButton } from "@/components/entity/row-edit-button";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import type { AdminCourt } from "@/lib/api/admin-courts";
import type { CourtStatus } from "@/lib/api/courts";

export function useCourtDirectoryColumns() {
  const t = useTranslations("courtDirectory");

  return useMemo<ColumnDef<AdminCourt, unknown>[]>(
    () => [
      createSelectionColumn<AdminCourt>({
        selectPage: t("selectPage"),
        selectRow: t("selectRow"),
      }),
      {
        id: "name",
        accessorKey: "name",
        header: t("columns.court"),
        size: 240,
        minSize: 160,
        cell: ({ row }) => (
          <DirectoryIdentityCell
            href={`/courts/${row.original.id}`}
            name={row.original.name}
            avatar
            subtitle={row.original.code}
          />
        ),
      },
      {
        id: "organization",
        accessorKey: "organization_name",
        header: t("columns.organization"),
        enableSorting: false,
        size: 160,
        cell: ({ row }) => (
          <DirectoryIdentityCell
            href={`/organizations/${row.original.organization_id}`}
            name={row.original.organization_name}
            avatar
            relation
            src={entityFileSrc(row.original.organization_logo_file_id)}
          />
        ),
      },
      {
        id: "branch",
        accessorKey: "branch_name",
        header: t("columns.branch"),
        enableSorting: false,
        size: 160,
        cell: ({ row }) => (
          <DirectoryIdentityCell
            href={`/branches/${row.original.branch_id}`}
            name={row.original.branch_name}
            avatar
            relation
            src={entityFileSrc(row.original.branch_logo_file_id)}
          />
        ),
      },
      {
        id: "sport",
        accessorKey: "sport_name",
        header: t("columns.sport"),
        enableSorting: false,
        size: 120,
        cell: ({ row }) => (
          <span className="text-foreground/80">{row.original.sport_name || t("emptyValue")}</span>
        ),
      },
      {
        id: "environment",
        accessorKey: "environment",
        header: t("columns.environment"),
        enableSorting: false,
        size: 120,
        cell: ({ row }) => (
          <span className="text-foreground/80">{t(`environment.${row.original.environment}`)}</span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: t("columns.status"),
        size: 120,
        cell: ({ row }) => (
          <SoftStatusChip
            label={t(`status.${row.original.status}`)}
            tone={COURT_STATUS_TONE[row.original.status as CourtStatus]}
          />
        ),
      },
      {
        id: "actions",
        header: t("columns.actions"),
        enableSorting: false,
        size: 96,
        cell: ({ row }) =>
          row.original.status === "archived" ? null : (
            <div className="flex items-center justify-end gap-1">
              <RowEditButton label={t("edit")} href={`/courts/${row.original.id}/edit`} />
              <CourtArchiveButton
                organizationId={row.original.organization_id}
                courtId={row.original.id}
                name={row.original.name}
                status={row.original.status}
              />
            </div>
          ),
      },
    ],
    [t],
  );
}
