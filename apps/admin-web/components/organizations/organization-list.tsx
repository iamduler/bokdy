"use client";

import { Button, Card, CardContent } from "@bokdy/ui";
import type { PaginationState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { DATA_LIST_PAGE_SIZE, DataTable } from "@/components/data-list";
import { EntityAvatar } from "@/components/entity/avatar";
import { EntityUnavailableBadge } from "@/components/entity/unavailable";
import { useOrganizationColumns } from "@/components/organizations/organization-columns";
import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import { Link } from "@/i18n/navigation";
import type { AdminOrganization } from "@/lib/api/admin";

type OrganizationListProps = {
  orgs: AdminOrganization[];
  hasFilters: boolean;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
  onOpenCreate: () => void;
};

export function OrganizationList({
  orgs,
  hasFilters,
  isLoading,
  isError,
  isFetching,
  onRetry,
  onOpenCreate,
}: OrganizationListProps) {
  const t = useTranslations("organization");
  const tc = useTranslations("common");
  const td = useTranslations("dataList");
  const columns = useOrganizationColumns();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DATA_LIST_PAGE_SIZE,
  });

  const sortedForMobile = useMemo(() => {
    const sort = sorting[0];
    if (!sort) return orgs;
    const dir = sort.desc ? -1 : 1;
    return [...orgs].sort((a, b) => {
      if (sort.id === "name") return a.name.localeCompare(b.name) * dir;
      if (sort.id === "branches") {
        return ((a.branch_count ?? 0) - (b.branch_count ?? 0)) * dir;
      }
      if (sort.id === "status") return a.status.localeCompare(b.status) * dir;
      return 0;
    });
  }, [orgs, sorting]);

  const pageOrgs = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    return sortedForMobile.slice(start, start + pagination.pageSize);
  }, [sortedForMobile, pagination]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataTable
        columns={columns}
        data={orgs}
        getRowId={(row) => row.id}
        sorting={sorting}
        onSortingChange={setSorting}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageSize={DATA_LIST_PAGE_SIZE}
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
        emptyTitle={hasFilters ? t("emptyFilter") : t("emptyNone")}
        emptyAction={
          !hasFilters ? (
            <Button type="button" size="sm" onClick={onOpenCreate}>
              + {t("create")}
            </Button>
          ) : null
        }
        mobileList={
          <div className="space-y-3 p-4">
            {pageOrgs.map((org) => (
              <OrganizationCard key={org.id} org={org} />
            ))}
          </div>
        }
      />
    </div>
  );
}

function OrganizationCard({ org }: { org: AdminOrganization }) {
  const t = useTranslations("organization");

  return (
    <Link href={`/organizations/${org.id}`} className="block">
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <EntityAvatar name={org.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{org.name}</p>
              <p className="text-xs text-muted-foreground">{org.code}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OrganizationStatusBadge kind="org" status={org.status} />
            <OrganizationStatusBadge kind="tenant" status={org.tenant_status} />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              {t("columns.branches")}: {org.branch_count ?? 0}
            </span>
            <EntityUnavailableBadge label={t("unavailable")} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
