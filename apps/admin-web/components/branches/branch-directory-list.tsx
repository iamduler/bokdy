"use client";

import { Card, CardContent, Checkbox } from "@bokdy/ui";
import type { OnChangeFn, PaginationState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { BranchArchiveButton } from "@/components/branches/branch-archive-button";
import { useBranchDirectoryColumns } from "@/components/branches/branch-directory-columns";
import { BRANCH_STATUS_TONE } from "@/components/branches/branch-status";
import { DATA_LIST_PAGE_SIZE, DataTable } from "@/components/data-list";
import { BulkDeleteBar } from "@/components/entity/bulk-delete-bar";
import { EntityAvatar, entityFileSrc } from "@/components/entity/avatar";
import { RowEditButton } from "@/components/entity/row-edit-button";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { useArchiveAdminBranches } from "@/hooks/use-admin-branches";
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
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkError, setBulkError] = useState<string | null>(null);
  const archiveMany = useArchiveAdminBranches();
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

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
        enableRowSelection={(branch) => branch.status !== "archived"}
        footerLeading={
          <BulkDeleteBar
            placement="footer"
            count={selectedIds.length}
            selectedLabel={t("bulkSelected", { count: selectedIds.length })}
            deleteLabel={t("bulkDelete")}
            title={t("bulkDeleteTitle", { count: selectedIds.length })}
            description={t("bulkDeleteConfirm", { count: selectedIds.length })}
            cancelLabel={t("cancel")}
            onClear={() => setRowSelection({})}
            pending={archiveMany.isPending}
            error={bulkError}
            onConfirm={async () => {
              setBulkError(null);
              const result = await archiveMany.mutateAsync(selectedIds);
              const failed = result.failed.map((item) => item.id);
              setRowSelection(Object.fromEntries(failed.map((id) => [id, true])));
              if (failed.length > 0) {
                setBulkError(t("bulkFailed", { count: failed.length }));
                throw new Error("bulk");
              }
            }}
          />
        }
        mobileList={
          rows.length === 0 ? undefined : (
            <div className="space-y-3 p-4">
              {rows.map((row) => (
                <BranchCard
                  key={row.id}
                  branch={row}
                  selected={Boolean(rowSelection[row.id])}
                  onSelectedChange={
                    row.status === "archived"
                      ? undefined
                      : (checked) =>
                          setRowSelection((current) => ({ ...current, [row.id]: checked }))
                  }
                />
              ))}
            </div>
          )
        }
      />
    </div>
  );
}

function BranchCard({
  branch,
  selected,
  onSelectedChange,
}: {
  branch: AdminBranch;
  selected: boolean;
  onSelectedChange?: (checked: boolean) => void;
}) {
  const t = useTranslations("branchDirectory");
  const place = [branch.address_line_1, branch.province_name].filter(Boolean).join(" · ");
  return (
    <Card className="soft-elevated border-border/40 shadow-none">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          {onSelectedChange ? (
            <Checkbox
              checked={selected}
              onCheckedChange={(value) => onSelectedChange(value === true)}
              aria-label={t("selectRow")}
            />
          ) : null}
          <Link href={`/branches/${branch.id}`} className="flex min-w-0 flex-1 items-start gap-3">
            <EntityAvatar name={branch.name} size="sm" src={entityFileSrc(branch.logo_file_id)} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{branch.name}</p>
              <p className="truncate text-xs text-muted-foreground">{branch.code}</p>
              {branch.organization_name ? (
                <p className="truncate text-xs text-muted-foreground">{branch.organization_name}</p>
              ) : null}
            </div>
          </Link>
          {branch.status === "archived" ? null : (
            <RowEditButton label={t("edit")} href={`/branches/${branch.id}/edit`} />
          )}
          <BranchArchiveButton
            organizationId={branch.organization_id}
            branchId={branch.id}
            name={branch.name}
            status={branch.status}
          />
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
  );
}
