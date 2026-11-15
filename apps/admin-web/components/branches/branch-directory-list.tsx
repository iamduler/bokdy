"use client";

import { Card, CardContent } from "@bokdy/ui";
import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useBranchDirectoryColumns } from "@/components/branches/branch-directory-columns";
import { BRANCH_STATUS_TONE } from "@/components/branches/branch-status";
import { DATA_LIST_PAGE_SIZE, DataTable } from "@/components/data-list";
import { EntityAvatar, entityFileSrc } from "@/components/entity/avatar";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { Link } from "@/i18n/navigation";
import type { AdminBranch } from "@/lib/api/admin-branches";
import type { BranchStatus } from "@/lib/api/branches";

type BranchDirectoryListProps = {
  rows: AdminBranch[];
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
};

export function BranchDirectoryList({
  rows,
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
}: BranchDirectoryListProps) {
  const t = useTranslations("branchDirectory");
  const tc = useTranslations("common");
  const td = useTranslations("dataList");
  const columns = useBranchDirectoryColumns();
  const [rowSelection, setRowSelection] = useState({});

  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
        emptyTitle={hasFilters ? t("emptyFilter") : t("emptyNone")}
        mobileList={
          rows.length === 0 ? undefined : (
            <div className="space-y-3 p-4">
              {rows.map((row) => (
                <BranchCard key={row.id} branch={row} />
              ))}
            </div>
          )
        }
      />
    </div>
  );
}

function BranchCard({ branch }: { branch: AdminBranch }) {
  const t = useTranslations("branchDirectory");
  const place = [branch.address_line_1, branch.province_name].filter(Boolean).join(" · ");
  return (
    <Link href={`/branches/${branch.id}`} className="block">
      <Card className="soft-elevated border-border/40 shadow-none">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <EntityAvatar name={branch.name} size="sm" src={entityFileSrc(branch.logo_file_id)} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{branch.name}</p>
              <p className="text-xs text-muted-foreground">{branch.code}</p>
              <div className="flex min-w-0 items-center gap-2">
                <EntityAvatar
                  name={branch.organization_name}
                  size="sm"
                  src={entityFileSrc(branch.organization_logo_file_id)}
                />
                <span className="truncate text-xs text-muted-foreground">
                  {branch.organization_name}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SoftStatusChip
              label={t(`status.${branch.status}`)}
              tone={BRANCH_STATUS_TONE[branch.status as BranchStatus]}
            />
            <span className="text-xs text-muted-foreground">
              {t("columns.courts")}: {branch.court_count}
            </span>
          </div>
          {place ? <p className="text-xs text-muted-foreground">{place}</p> : null}
        </CardContent>
      </Card>
    </Link>
  );
}
