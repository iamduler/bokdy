"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { createSelectionColumn } from "@/components/data-list";
import { RowEditButton } from "@/components/entity/row-edit-button";
import { DirectoryIdentityCell } from "@/components/data-list/directory-identity-cell";
import { entityFileSrc } from "@/components/entity/avatar";
import { EntityUnavailableBadge } from "@/components/entity/unavailable";
import { OrganizationArchiveButton } from "@/components/organizations/organization-archive-button";
import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import type { AdminOrganization } from "@/lib/api/admin";

export function useOrganizationColumns(onEdit: (org: AdminOrganization) => void) {
  const t = useTranslations("organization");

  return useMemo<ColumnDef<AdminOrganization, unknown>[]>(
    () => [
      createSelectionColumn<AdminOrganization>({
        selectPage: t("selectPage"),
        selectRow: t("selectRow"),
      }),
      {
        id: "name",
        accessorKey: "name",
        header: t("columns.organization"),
        size: 260,
        minSize: 180,
        cell: ({ row }) => {
          const org = row.original;
          return (
            <DirectoryIdentityCell
              href={`/organizations/${org.id}`}
              name={org.name}
              avatar
              src={entityFileSrc(org.logo_file_id)}
              subtitle={
                <>
                  {org.code}
                  {" · "}
                  <span className="text-muted-foreground/80">
                    {org.owner_display_name || t("emptyValue")}
                  </span>
                </>
              }
            />
          );
        },
      },
      {
        id: "sport",
        accessorFn: (row) => row.primary_sport ?? "",
        header: t("columns.sport"),
        enableSorting: false,
        size: 110,
        cell: ({ row }) => (
          <span className="text-foreground/80">
            {row.original.primary_sport || t("emptyValue")}
          </span>
        ),
      },
      {
        id: "branches",
        accessorFn: (row) => row.branch_count ?? 0,
        header: t("columns.branches"),
        size: 90,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-foreground/80">
            {String(getValue())}
          </span>
        ),
      },
      {
        id: "courts",
        accessorFn: (row) => row.court_count ?? 0,
        header: t("columns.courts"),
        size: 90,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-foreground/80">
            {String(getValue())}
          </span>
        ),
      },
      {
        id: "plan",
        header: t("columns.plan"),
        enableSorting: false,
        size: 100,
        cell: () => <EntityUnavailableBadge label={t("unavailable")} />,
      },
      {
        id: "status",
        accessorKey: "status",
        header: t("columns.status"),
        size: 130,
        cell: ({ row }) => (
          <OrganizationStatusBadge kind="org" status={row.original.status} />
        ),
      },
      {
        id: "tenant_status",
        accessorKey: "tenant_status",
        header: t("columns.tenantStatus"),
        enableSorting: false,
        size: 120,
        cell: ({ row }) => (
          <OrganizationStatusBadge
            kind="tenant"
            status={row.original.tenant_status}
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
              <RowEditButton
                label={t("detailOverview.editProfile")}
                onClick={() => onEdit(row.original)}
              />
              <OrganizationArchiveButton
                orgId={row.original.id}
                name={row.original.name}
                status={row.original.status}
              />
            </div>
          ),
      },
    ],
    [onEdit, t],
  );
}
