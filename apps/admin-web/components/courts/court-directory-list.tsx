"use client";

import { Card, CardContent, Checkbox } from "@bokdy/ui";
import type { OnChangeFn, PaginationState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { CourtArchiveButton } from "@/components/courts/court-archive-button";
import { useCourtDirectoryColumns } from "@/components/courts/court-directory-columns";
import { COURT_STATUS_TONE } from "@/components/courts/court-status";
import { DATA_LIST_PAGE_SIZE, DataTable } from "@/components/data-list";
import { BulkDeleteBar } from "@/components/entity/bulk-delete-bar";
import { EntityAvatar } from "@/components/entity/avatar";
import { RowEditButton } from "@/components/entity/row-edit-button";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { useArchiveAdminCourts } from "@/hooks/use-admin-courts";
import { Link } from "@/i18n/navigation";
import type { AdminCourt } from "@/lib/api/admin-courts";
import type { CourtStatus } from "@/lib/api/courts";

type CourtDirectoryListProps = {
  rows: AdminCourt[];
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

export function CourtDirectoryList(props: CourtDirectoryListProps) {
  const t = useTranslations("courtDirectory");
  const tc = useTranslations("common");
  const td = useTranslations("dataList");
  const columns = useCourtDirectoryColumns();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkError, setBulkError] = useState<string | null>(null);
  const archiveMany = useArchiveAdminCourts();
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const { rows } = props;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        sorting={props.sorting}
        onSortingChange={props.onSortingChange}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        pagination={{ pageIndex: props.pageIndex, pageSize: DATA_LIST_PAGE_SIZE }}
        onPaginationChange={props.onPaginationChange}
        pageSize={DATA_LIST_PAGE_SIZE}
        manualPagination
        manualSorting
        rowCount={props.total}
        paginationLabels={{
          previous: td("previousPage"),
          next: td("nextPage"),
          summary: (params) => td("pageSummary", params),
        }}
        isLoading={props.isLoading}
        isError={props.isError}
        errorMessage={t("loadError")}
        onRetry={props.onRetry}
        retryLabel={props.isFetching ? tc("loading") : tc("retry")}
        emptyTitle={props.hasFilters ? t("emptyFilter") : t("emptyNone")}
        enableRowSelection={(court) => court.status === "inactive"}
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
                <CourtCard
                  key={row.id}
                  court={row}
                  selected={Boolean(rowSelection[row.id])}
                  onSelectedChange={
                    row.status === "inactive"
                      ? (checked) =>
                          setRowSelection((current) => ({ ...current, [row.id]: checked }))
                      : undefined
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

function CourtCard({
  court,
  selected,
  onSelectedChange,
}: {
  court: AdminCourt;
  selected: boolean;
  onSelectedChange?: (checked: boolean) => void;
}) {
  const t = useTranslations("courtDirectory");
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
          <Link href={`/courts/${court.id}`} className="flex min-w-0 flex-1 items-start gap-3">
            <EntityAvatar name={court.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{court.name}</p>
              <p className="truncate text-xs text-muted-foreground">{court.code}</p>
              {court.branch_name ? (
                <p className="truncate text-xs text-muted-foreground">{court.branch_name}</p>
              ) : null}
            </div>
          </Link>
          {court.status === "archived" ? null : (
            <RowEditButton label={t("edit")} href={`/courts/${court.id}/edit`} />
          )}
          <CourtArchiveButton
            organizationId={court.organization_id}
            courtId={court.id}
            name={court.name}
            status={court.status}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SoftStatusChip
            label={t(`status.${court.status}`)}
            tone={COURT_STATUS_TONE[court.status as CourtStatus]}
          />
          <span className="text-xs text-muted-foreground">
            {t(`environment.${court.environment}`)}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {court.organization_name}
          {" · "}
          {court.sport_name || t("emptyValue")}
        </p>
        </CardContent>
      </Card>
  );
}
