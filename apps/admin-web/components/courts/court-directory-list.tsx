"use client";

import { Card, CardContent } from "@bokdy/ui";
import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useCourtDirectoryColumns } from "@/components/courts/court-directory-columns";
import { COURT_STATUS_TONE } from "@/components/courts/court-status";
import { DATA_LIST_PAGE_SIZE, DataTable } from "@/components/data-list";
import { EntityAvatar, entityFileSrc } from "@/components/entity/avatar";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
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
  const [rowSelection, setRowSelection] = useState({});
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
        mobileList={
          rows.length === 0 ? undefined : (
            <div className="space-y-3 p-4">
              {rows.map((row) => (
                <CourtCard key={row.id} court={row} />
              ))}
            </div>
          )
        }
      />
    </div>
  );
}

function CourtCard({ court }: { court: AdminCourt }) {
  const t = useTranslations("courtDirectory");
  return (
    <Link href={`/courts/${court.id}`} className="block">
      <Card className="soft-elevated border-border/40 shadow-none">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <EntityAvatar name={court.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{court.name}</p>
              <p className="text-xs text-muted-foreground">{court.code}</p>
              <div className="flex min-w-0 items-center gap-2">
                <EntityAvatar
                  name={court.branch_name}
                  size="sm"
                  src={entityFileSrc(court.branch_logo_file_id)}
                />
                <span className="truncate text-xs text-muted-foreground">{court.branch_name}</span>
              </div>
            </div>
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
          <div className="flex min-w-0 items-center gap-2">
            <EntityAvatar
              name={court.organization_name}
              size="sm"
              src={entityFileSrc(court.organization_logo_file_id)}
            />
            <span className="truncate text-xs text-muted-foreground">
              {court.organization_name}
              {" · "}
              {court.sport_name || t("emptyValue")}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
