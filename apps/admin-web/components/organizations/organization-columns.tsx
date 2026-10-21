"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { EntityAvatar } from "@/components/entity/avatar";
import { EntityUnavailableBadge } from "@/components/entity/unavailable";
import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import { Link } from "@/i18n/navigation";
import type { AdminOrganization } from "@/lib/api/admin";

export function useOrganizationColumns() {
  const t = useTranslations("organization");

  return useMemo<ColumnDef<AdminOrganization, unknown>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: t("columns.organization"),
        size: 260,
        minSize: 180,
        cell: ({ row }) => {
          const org = row.original;
          return (
            <div className="flex min-w-0 items-center gap-2.5">
              <EntityAvatar name={org.name} size="sm" />
              <div className="min-w-0">
                <Link
                  href={`/organizations/${org.id}`}
                  className="block truncate font-medium text-foreground underline-offset-4"
                >
                  {org.name}
                </Link>
                <p className="truncate text-[11px] text-muted-foreground">
                  {org.code}
                  {" · "}
                  <span className="text-muted-foreground/80">
                    {t("ownerUnavailable")}
                  </span>
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "sport",
        header: t("columns.sport"),
        enableSorting: false,
        size: 110,
        cell: () => <EntityUnavailableBadge label={t("unavailable")} />,
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
        header: t("columns.courts"),
        enableSorting: false,
        size: 90,
        cell: () => <EntityUnavailableBadge label={t("unavailable")} />,
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
        size: 120,
        cell: ({ row }) => (
          <OrganizationStatusBadge
            kind="tenant"
            status={row.original.tenant_status}
          />
        ),
      },
    ],
    [t],
  );
}
