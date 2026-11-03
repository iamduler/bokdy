"use client";

import { Button, Card, CardContent } from "@bokdy/ui";
import type { OnChangeFn, PaginationState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  DATA_LIST_PAGE_SIZE,
  DataTable,
  softDirectoryPrimaryBtn,
} from "@/components/data-list";
import { EntityAvatar } from "@/components/entity/avatar";
import { useOrganizationColumns } from "@/components/organizations/organization-columns";
import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import { Link } from "@/i18n/navigation";
import type { AdminOrganization } from "@/lib/api/admin";

type OrganizationListProps = {
  orgs: AdminOrganization[];
  total: number;
  pageIndex: number;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  onPaginationChange: OnChangeFn<PaginationState>;
  hasFilters: boolean;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
  onOpenCreate: () => void;
};

export function OrganizationList({
  orgs,
  total,
  pageIndex,
  sorting,
  onSortingChange,
  onPaginationChange,
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
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataTable
        columns={columns}
        data={orgs}
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
        emptyTitle={hasFilters ? t("emptyFilter") : t("emptyNone")}
        emptyAction={
          !hasFilters ? (
            <Button
              type="button"
              size="sm"
              className={softDirectoryPrimaryBtn}
              onClick={onOpenCreate}
            >
              + {t("create")}
            </Button>
          ) : null
        }
        mobileList={
          orgs.length === 0 ? undefined : (
            <div className="space-y-3 p-4">
              {orgs.map((org) => (
                <OrganizationCard key={org.id} org={org} />
              ))}
            </div>
          )
        }
      />
    </div>
  );
}

function OrganizationCard({ org }: { org: AdminOrganization }) {
  const t = useTranslations("organization");

  return (
    <Link href={`/organizations/${org.id}`} className="block">
      <Card className="soft-elevated border-border/40 shadow-none">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <EntityAvatar name={org.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{org.name}</p>
              <p className="text-xs text-muted-foreground">
                {org.code}
                {" · "}
                {org.owner_display_name || t("emptyValue")}
              </p>
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
            <span>
              {t("columns.courts")}: {org.court_count ?? 0}
            </span>
            <span>
              {t("columns.sport")}: {org.primary_sport || t("emptyValue")}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
