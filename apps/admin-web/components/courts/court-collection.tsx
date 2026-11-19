"use client";

import {
  Button,
  Checkbox,
  Table,
  toast,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bokdy/ui";
import { Home, LayoutGrid, Plus, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { sportLabel } from "@/components/branches/branch-sports-chips";
import {
  DataListEmpty,
  DataTablePagination,
  DataTableSkeleton,
} from "@/components/data-list";
import { FilterSearchField } from "@/components/data-list/filter-search-field";
import { FilterSelect } from "@/components/data-list/filter-select";
import { CourtArchiveButton } from "@/components/courts/court-archive-button";
import { CourtCard } from "@/components/courts/court-card";
import { CourtFormSheet } from "@/components/courts/court-form-sheet";
import { COURT_STATUS_TONE } from "@/components/courts/court-status";
import { BulkDeleteBar } from "@/components/entity/bulk-delete-bar";
import { EntityCollectionPanel } from "@/components/entity/collection-panel";
import { useBulkSelection } from "@/components/entity/use-bulk-selection";
import { CollectionViewToggle } from "@/components/entity/collection-view-toggle";
import { EntityRelationLink } from "@/components/entity/relation-link";
import { RowEditButton } from "@/components/entity/row-edit-button";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { useClientCollectionPage } from "@/components/entity/use-client-collection-page";
import { useCollectionViewMode } from "@/components/entity/use-collection-view-mode";
import { type PopoverCommandOption } from "@/components/popover-command-select";
import { useSports } from "@/hooks/use-sports";
import { useRouter } from "@/i18n/navigation";
import type { BulkActionResult } from "@/lib/api/branches";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import type { Court, CourtEnvironment, CourtStatus } from "@/lib/api/courts";

const ALL = "";
const EMPTY_COURTS: Court[] = [];
const STATUSES = ["active", "inactive", "maintenance", "archived"] as const satisfies readonly CourtStatus[];
const ENVIRONMENTS = ["indoor", "outdoor", "unspecified"] as const satisfies readonly CourtEnvironment[];

export type CourtCollectionBranch = {
  id: string;
  name: string;
  code?: string;
};

function environmentIcon(environment: string) {
  if (environment === "indoor") return <Home className="size-3.5" aria-hidden />;
  if (environment === "outdoor") return <Sun className="size-3.5" aria-hidden />;
  return null;
}

function matchesQuery(court: Court, needle: string) {
  if (!needle) return true;
  const haystack = [court.name, court.name_vi, court.name_en, court.code]
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function CourtCollection({
  courts,
  isLoading,
  isError,
  retryDisabled,
  onRetry,
  errorMessage,
  emptyTitle,
  onCreate,
  branches,
  onArchiveSelected,
  organizationId,
  fixedBranchId,
}: {
  courts: Court[] | undefined;
  isLoading: boolean;
  isError: boolean;
  retryDisabled?: boolean;
  onRetry: () => void;
  errorMessage: string;
  emptyTitle: string;
  onCreate: () => void;
  organizationId: string;
  fixedBranchId?: string;
  /** When set, the list spans branches and shows a branch filter plus column. */
  branches?: CourtCollectionBranch[];
  /** Branch courts only. Inactive courts can be archived together. */
  onArchiveSelected?: (ids: string[]) => Promise<BulkActionResult>;
}) {
  const t = useTranslations("organization.courtList");
  const tc = useTranslations("organization.court");
  const tCommon = useTranslations("common");
  const tOrg = useTranslations("organization");
  const tActions = useTranslations("dataList");
  const te = useTranslations("errors");
  const tBulk = useTranslations("organization.branchDetail.courts");
  const locale = useLocale();
  const router = useRouter();
  const { data: sports = [] } = useSports();
  const { mode, setMode } = useCollectionViewMode("courts", "list");

  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState(ALL);
  const [filterEnv, setFilterEnv] = useState(ALL);
  const [filterBranch, setFilterBranch] = useState(ALL);
  const [editing, setEditing] = useState<Court | null>(null);

  const source = courts ?? EMPTY_COURTS;
  const showBranch = branches != null;
  const branchName = useMemo(
    () => new Map((branches ?? []).map((branch) => [branch.id, branch.name])),
    [branches],
  );

  const needle = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    return source.filter((court) => {
      if (!matchesQuery(court, needle)) return false;
      if (filterStatus && court.status !== filterStatus) return false;
      if (filterEnv && court.environment !== filterEnv) return false;
      if (showBranch && filterBranch && court.branch_id !== filterBranch) return false;
      return true;
    });
  }, [filterBranch, filterEnv, filterStatus, needle, showBranch, source]);

  const resetKey = `${needle}|${filterStatus}|${filterEnv}|${filterBranch}`;
  const { pageItems, pagination } = useClientCollectionPage(filtered, resetKey);
  const selection = useBulkSelection();
  const selectablePageIds = pageItems
    .filter((court) => court.status === "inactive")
    .map((court) => court.id);
  const pageAllSelected =
    selectablePageIds.length > 0 && selectablePageIds.every((id) => selection.selectedSet.has(id));

  const statusOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: ALL, label: t("allStatuses"), keywords: "all" },
      ...STATUSES.map((status) => ({
        value: status,
        label: tc(`status.${status}`),
        keywords: status,
      })),
    ],
    [t, tc],
  );

  const envOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: ALL, label: t("allEnvironments"), keywords: "all" },
      ...ENVIRONMENTS.map((env) => ({
        value: env,
        label: tc(`environment.${env}`),
        keywords: env,
      })),
    ],
    [t, tc],
  );

  const branchOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: ALL, label: t("allBranches"), keywords: "all" },
      ...(branches ?? []).map((branch) => ({
        value: branch.id,
        label: branch.name,
        keywords: `${branch.code ?? ""} ${branch.name}`,
      })),
    ],
    [branches, t],
  );

  function addButton() {
    return (
      <Button type="button" size="sm" onClick={onCreate}>
        <Plus className="size-3.5" aria-hidden />
        {t("addCourt")}
      </Button>
    );
  }

  return (
    <EntityCollectionPanel
      title={t("title")}
      icon={<LayoutGrid className="size-4" aria-hidden />}
      tone="sky"
      actions={
        <div className="flex items-center gap-2">
          <CollectionViewToggle mode={mode} onChange={setMode} />
          {addButton()}
        </div>
      }
      toolbar={
        source.length > 0 ? (
          <>
            <FilterSearchField value={query} onChange={setQuery} label={t("search")} />
            {showBranch ? (
              <FilterSelect
                value={filterBranch}
                onValueChange={setFilterBranch}
                options={branchOptions}
                ariaLabel={t("filterBranch")}
                searchable
              />
            ) : null}
            <FilterSelect
              value={filterStatus}
              onValueChange={setFilterStatus}
              options={statusOptions}
              ariaLabel={t("filterStatus")}
            />
            <FilterSelect
              value={filterEnv}
              onValueChange={setFilterEnv}
              options={envOptions}
              ariaLabel={t("filterEnvironment")}
            />
          </>
        ) : null
      }
      pagination={
        !isLoading && !isError && filtered.length > 0 ? (
          <DataTablePagination
            {...pagination}
            className="bg-transparent px-0 md:px-0"
            leading={
              onArchiveSelected ? (
                <BulkDeleteBar
                  placement="footer"
                  count={selection.selected.length}
                  selectedLabel={tOrg("bulkSelected", { count: selection.selected.length })}
                  deleteLabel={tOrg("delete")}
                  title={tBulk("bulkDeleteTitle", { count: selection.selected.length })}
                  description={tBulk("bulkDeleteConfirm", { count: selection.selected.length })}
                  cancelLabel={tOrg("cancel")}
                  onClear={selection.clear}
                  onConfirm={async () => {
                    let result: BulkActionResult;
                    try {
                      result = await onArchiveSelected(selection.selected);
                    } catch (err) {
                      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
                      toast.error(te(errorMessageKey(apiErr)));
                      throw err;
                    }
                    selection.keep(result.failed.map((item) => item.id));
                    if (result.succeeded.length > 0) {
                      toast.success(tBulk("bulkDeleted", { count: result.succeeded.length }));
                    }
                    if (result.failed.length > 0) {
                      toast.error(tOrg("bulkFailed", { count: result.failed.length }));
                    }
                  }}
                />
              ) : null
            }
          />
        ) : null
      }
    >
      {isLoading ? <DataTableSkeleton rows={4} columns={showBranch ? 6 : 5} className="px-0" /> : null}
      {isError ? (
        <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{errorMessage}</p>
          <Button variant="outline" size="lg" onClick={onRetry} disabled={retryDisabled}>
            {tCommon("retry")}
          </Button>
        </div>
      ) : null}
      {!isLoading && !isError && filtered.length === 0 ? (
        <DataListEmpty
          title={source.length === 0 ? emptyTitle : t("emptyFiltered")}
          className="py-10"
          action={source.length === 0 ? addButton() : undefined}
        />
      ) : null}
      {!isLoading && !isError && filtered.length > 0 && mode === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((court) => (
            <CourtCard
              key={court.id}
              court={court}
              showBranch={showBranch}
              branchName={branchName.get(court.branch_id)}
              selected={selection.selectedSet.has(court.id)}
              selectLabel={tOrg("selectRow")}
              onSelectedChange={
                onArchiveSelected && court.status === "inactive"
                  ? () => selection.toggle(court.id)
                  : undefined
              }
              actions={
                <CourtRowActions
                  court={court}
                  organizationId={organizationId}
                  editLabel={tc("editCourt")}
                  onEdit={() => setEditing(court)}
                />
              }
            />
          ))}
        </div>
      ) : null}
      {!isLoading && !isError && filtered.length > 0 && mode === "list" ? (
        <Table>
          <TableHeader>
            <TableRow>
              {onArchiveSelected ? (
                <TableHead className="w-10">
                  <Checkbox
                    checked={pageAllSelected ? true : selectablePageIds.some((id) => selection.selectedSet.has(id)) ? "indeterminate" : false}
                    disabled={selectablePageIds.length === 0}
                    aria-label={tOrg("selectPage")}
                    onCheckedChange={() => selection.toggleMany(selectablePageIds)}
                  />
                </TableHead>
              ) : null}
              <TableHead>{t("colName")}</TableHead>
              <TableHead>{t("colSport")}</TableHead>
              <TableHead>{t("colSurface")}</TableHead>
              <TableHead>{t("colEnvironment")}</TableHead>
              <TableHead>{t("colStatus")}</TableHead>
              {showBranch ? <TableHead>{t("colBranch")}</TableHead> : null}
              <TableHead className="text-right">{tActions("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((court) => {
              const sport = sports.find((item) => item.id === court.sport_id);
              const surface = court.surface ?? "unspecified";
              return (
                <TableRow
                  key={court.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/courts/${court.id}`)}
                >
                  {onArchiveSelected ? (
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      {court.status === "inactive" ? (
                        <Checkbox
                          checked={selection.selectedSet.has(court.id)}
                          aria-label={tOrg("selectRow")}
                          onCheckedChange={() => selection.toggle(court.id)}
                        />
                      ) : null}
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <span onClick={(event) => event.stopPropagation()}>
                      <EntityRelationLink href={`/courts/${court.id}`} className="block">
                        {court.name}
                      </EntityRelationLink>
                    </span>
                    <p className="text-xs text-muted-foreground">{court.code}</p>
                  </TableCell>
                  <TableCell>{sport ? sportLabel(sport, locale) : tc("emptyValue")}</TableCell>
                  <TableCell className="text-muted-foreground">{tc(`surface.${surface}`)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      {environmentIcon(court.environment)}
                      {tc(`environment.${court.environment}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <SoftStatusChip
                      label={tc(`status.${court.status}`)}
                      tone={COURT_STATUS_TONE[court.status]}
                    />
                  </TableCell>
                  {showBranch ? (
                    <TableCell className="text-muted-foreground">
                      {branchName.get(court.branch_id) || tc("emptyValue")}
                    </TableCell>
                  ) : null}
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <CourtRowActions
                      court={court}
                      organizationId={organizationId}
                      editLabel={tc("editCourt")}
                      onEdit={() => setEditing(court)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : null}
      {editing ? (
        <CourtFormSheet
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          organizationId={organizationId}
          fixedBranchId={fixedBranchId}
          mode="edit"
          court={editing}
        />
      ) : null}
    </EntityCollectionPanel>
  );
}

function CourtRowActions({
  court,
  organizationId,
  editLabel,
  onEdit,
}: {
  court: Court;
  organizationId: string;
  editLabel: string;
  onEdit: () => void;
}) {
  if (court.status === "archived") return null;
  return (
    <div className="flex items-center justify-end gap-1">
      <RowEditButton label={editLabel} onClick={onEdit} />
      <CourtArchiveButton
        organizationId={organizationId}
        courtId={court.id}
        name={court.name}
        status={court.status}
      />
    </div>
  );
}
