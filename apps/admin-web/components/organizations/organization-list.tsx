"use client";

import { Button, Card, CardContent, Checkbox } from "@bokdy/ui";
import type { OnChangeFn, PaginationState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  DATA_LIST_PAGE_SIZE,
  DataTable,
  softDirectoryPrimaryBtn,
} from "@/components/data-list";
import { BulkDeleteBar } from "@/components/entity/bulk-delete-bar";
import { EntityAvatar, entityFileSrc } from "@/components/entity/avatar";
import { RowEditButton } from "@/components/entity/row-edit-button";
import { useOrganizationColumns } from "@/components/organizations/organization-columns";
import { OrganizationArchiveButton } from "@/components/organizations/organization-archive-button";
import { OrganizationFormSheet } from "@/components/organizations/organization-form-sheet";
import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import { useArchiveOrganizations } from "@/hooks/use-archive-organization";
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
  const [editing, setEditing] = useState<AdminOrganization | null>(null);
  const columns = useOrganizationColumns(setEditing);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkError, setBulkError] = useState<string | null>(null);
  const archiveMany = useArchiveOrganizations();
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

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
        enableRowSelection={(org) => org.status !== "archived"}
        footerLeading={
          <BulkDeleteBar
            placement="footer"
            count={selectedIds.length}
            selectedLabel={t("bulkSelected", { count: selectedIds.length })}
            deleteLabel={t("delete")}
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
                <OrganizationCard
                  key={org.id}
                  org={org}
                  selected={Boolean(rowSelection[org.id])}
                  onSelectedChange={
                    org.status === "archived"
                      ? undefined
                      : (checked) =>
                          setRowSelection((current) => ({ ...current, [org.id]: checked }))
                  }
                  onEdit={org.status === "archived" ? undefined : () => setEditing(org)}
                />
              ))}
            </div>
          )
        }
      />
      {editing ? (
        <OrganizationFormSheet
          open
          mode="edit"
          organization={editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

function OrganizationCard({
  org,
  selected,
  onSelectedChange,
  onEdit,
}: {
  org: AdminOrganization;
  selected: boolean;
  onSelectedChange?: (checked: boolean) => void;
  onEdit?: () => void;
}) {
  const t = useTranslations("organization");

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
          <Link href={`/organizations/${org.id}`} className="flex min-w-0 flex-1 items-start gap-3">
            <EntityAvatar name={org.name} size="sm" src={entityFileSrc(org.logo_file_id)} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{org.name}</p>
              <p className="text-xs text-muted-foreground">
                {org.code}
                {" · "}
                {org.owner_display_name || t("emptyValue")}
              </p>
            </div>
          </Link>
          {onEdit ? (
            <RowEditButton label={t("detailOverview.editProfile")} onClick={onEdit} />
          ) : null}
          <OrganizationArchiveButton orgId={org.id} name={org.name} status={org.status} />
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
  );
}
