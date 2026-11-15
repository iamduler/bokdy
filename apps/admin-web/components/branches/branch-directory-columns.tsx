"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { BRANCH_STATUS_TONE } from "@/components/branches/branch-status";
import { DirectoryIdentityCell } from "@/components/data-list/directory-identity-cell";
import { entityFileSrc } from "@/components/entity/avatar";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import type { AdminBranch } from "@/lib/api/admin-branches";
import type { BranchStatus } from "@/lib/api/branches";

function place(branch: AdminBranch) {
  return [branch.address_line_1, branch.province_name].filter(Boolean).join(" · ");
}

export function useBranchDirectoryColumns() {
  const t = useTranslations("branchDirectory");

  return useMemo<ColumnDef<AdminBranch, unknown>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: t("columns.branch"),
        size: 260,
        minSize: 180,
        cell: ({ row }) => (
          <DirectoryIdentityCell
            href={`/branches/${row.original.id}`}
            name={row.original.name}
            avatar
            src={entityFileSrc(row.original.logo_file_id)}
            subtitle={row.original.code}
          />
        ),
      },
      {
        id: "organization",
        accessorKey: "organization_name",
        header: t("columns.organization"),
        enableSorting: false,
        size: 180,
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
        id: "address",
        accessorFn: (row) => place(row),
        header: t("columns.address"),
        enableSorting: false,
        size: 220,
        cell: ({ row }) => (
          <span className="text-foreground/80">{place(row.original) || t("emptyValue")}</span>
        ),
      },
      {
        id: "courts",
        accessorKey: "court_count",
        header: t("columns.courts"),
        size: 80,
        cell: ({ row }) => (
          <span className="tabular-nums text-foreground/80">{row.original.court_count}</span>
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
            tone={BRANCH_STATUS_TONE[row.original.status as BranchStatus]}
          />
        ),
      },
    ],
    [t],
  );
}
