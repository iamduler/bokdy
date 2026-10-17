"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Check, Pause, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  DataTableRowActions,
  createSelectionColumn,
  type DataTableRowAction,
} from "@/components/data-list";
import { EntityAvatar } from "@/components/entity/avatar";
import { EntityUnavailableBadge } from "@/components/entity/unavailable";
import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import { useActivateOrganization } from "@/hooks/use-activate-organization";
import { useRestoreOrganization } from "@/hooks/use-restore-organization";
import { Link, useRouter } from "@/i18n/navigation";
import type { AdminOrganization } from "@/lib/api/admin";

export function useOrganizationColumns() {
  const t = useTranslations("organization");
  const td = useTranslations("dataList");
  const router = useRouter();
  const activate = useActivateOrganization();
  const restore = useRestoreOrganization();

  return useMemo<ColumnDef<AdminOrganization, unknown>[]>(
    () => [
      createSelectionColumn<AdminOrganization>(),
      {
        id: "name",
        accessorKey: "name",
        header: t("columns.organization"),
        size: 240,
        minSize: 160,
        cell: ({ row }) => {
          const org = row.original;
          return (
            <div className="flex min-w-0 items-center gap-2.5">
              <EntityAvatar name={org.name} size="sm" />
              <div className="min-w-0">
                <Link
                  href={`/organizations/${org.id}`}
                  className="block truncate font-medium text-foreground underline-offset-4 hover:underline"
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
        size: 100,
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
        size: 80,
        cell: () => <EntityUnavailableBadge label={t("unavailable")} />,
      },
      {
        id: "plan",
        header: t("columns.plan"),
        enableSorting: false,
        size: 90,
        cell: () => <EntityUnavailableBadge label={t("unavailable")} />,
      },
      {
        id: "status",
        accessorKey: "status",
        header: t("columns.status"),
        size: 140,
        cell: ({ row }) => (
          <div className="flex flex-col items-start gap-1">
            <OrganizationStatusBadge kind="org" status={row.original.status} />
            <OrganizationStatusBadge
              kind="tenant"
              status={row.original.tenant_status}
            />
          </div>
        ),
      },
      {
        id: "actions",
        header: t("columns.actions") || td("actions"),
        enableSorting: false,
        enableResizing: false,
        size: 120,
        minSize: 120,
        maxSize: 120,
        cell: ({ row }) => {
          const org = row.original;
          const moreActions: DataTableRowAction[] = [];
          if (org.status === "inactive") {
            moreActions.push({
              id: "activate",
              label: t("activate"),
              icon: <Check />,
              disabled: activate.isPending,
              onSelect: () => {
                void activate.mutateAsync(org.id).catch(() => undefined);
              },
            });
          }
          if (org.status === "active") {
            moreActions.push({
              id: "suspend",
              label: t("suspend"),
              icon: <Pause />,
              destructive: true,
              onSelect: () => {
                router.push(`/organizations/${org.id}/actions`);
              },
            });
          }
          if (org.status === "suspended") {
            moreActions.push({
              id: "restore",
              label: t("restore"),
              icon: <RotateCcw />,
              disabled: restore.isPending,
              onSelect: () => {
                void restore.mutateAsync(org.id).catch(() => undefined);
              },
            });
          }
          return (
            <DataTableRowActions
              viewHref={`/organizations/${org.id}`}
              viewLabel={t("detailAction")}
              editHref={`/organizations/${org.id}/edit`}
              editLabel={t("editAction")}
              moreLabel={t("moreActions")}
              moreActions={moreActions}
            />
          );
        },
      },
    ],
    [t, td, activate, restore, router],
  );
}
