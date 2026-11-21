"use client";

import {
  Button,
  Checkbox,
  cn,
  Table,
  toast,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bokdy/ui";
import { Building2, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { sportLabel } from "@/components/branches/branch-sports-chips";
import { BRANCH_STATUS_TONE } from "@/components/branches/branch-status";
import {
  DataListEmpty,
  DataTablePagination,
  DataTableSkeleton,
  softDetailSectionGap,
} from "@/components/data-list";
import { FilterSearchField } from "@/components/data-list/filter-search-field";
import { FilterSelect } from "@/components/data-list/filter-select";
import { BulkDeleteBar } from "@/components/entity/bulk-delete-bar";
import { EntityCollectionPanel } from "@/components/entity/collection-panel";
import { SectionAddButton } from "@/components/entity/section-add-button";
import { useBulkSelection } from "@/components/entity/use-bulk-selection";
import { CollectionViewToggle } from "@/components/entity/collection-view-toggle";
import { EntityRelationLink } from "@/components/entity/relation-link";
import { RowEditButton } from "@/components/entity/row-edit-button";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { useClientCollectionPage } from "@/components/entity/use-client-collection-page";
import { useCollectionViewMode } from "@/components/entity/use-collection-view-mode";
import { useOrganizationDetail } from "@/components/organizations/detail/organization-detail-context";
import { type PopoverCommandOption } from "@/components/popover-command-select";
import { useArchiveBranches, useBranches } from "@/hooks/use-branches";
import { useSports } from "@/hooks/use-sports";
import { currentBranchAddress, type Branch, type BranchStatus } from "@/lib/api/branches";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import type { Sport } from "@/lib/api/sports";

import { BranchArchiveButton } from "./branch-archive-button";
import { BranchCard } from "./branch-card";
import { BranchFormSheet } from "./branch-form-sheet";

const ROW = "border-border/40 hover:bg-muted/30";
const ALL = "";
const BRANCH_STATUSES = ["active", "inactive", "maintenance", "archived"] as const satisfies readonly BranchStatus[];

function includesQuery(parts: Array<string | null | undefined>, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return parts.some((part) => part?.toLowerCase().includes(needle));
}

function sportNames(sports: Sport[], ids: string[] | undefined, locale: string) {
  const byId = new Map(sports.map((sport) => [sport.id, sport]));
  return (ids ?? [])
    .map((id) => byId.get(id))
    .filter((sport): sport is Sport => Boolean(sport))
    .map((sport) => sportLabel(sport, locale))
    .join(", ");
}

function BranchList({
  branches,
  sports,
  locale,
  onEdit,
  selected,
  pageSelected,
  onToggle,
  onTogglePage,
}: {
  branches: Branch[];
  sports: Sport[];
  locale: string;
  onEdit: (branch: Branch) => void;
  selected: Set<string>;
  pageSelected: boolean;
  onToggle: (id: string) => void;
  onTogglePage: (ids: string[]) => void;
}) {
  const t = useTranslations("organization.detailBranches");
  const tb = useTranslations("organization.branch");
  const to = useTranslations("organization");
  const selectableIds = branches.filter((branch) => branch.status !== "archived").map((branch) => branch.id);

  return (
    <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow className="border-border/40 hover:bg-transparent">
            <TableHead className="w-10">
              <Checkbox
                checked={
                  pageSelected
                    ? true
                    : selectableIds.some((id) => selected.has(id))
                      ? "indeterminate"
                      : false
                }
                disabled={selectableIds.length === 0}
                aria-label={to("selectPage")}
                onCheckedChange={() => onTogglePage(selectableIds)}
              />
            </TableHead>
            {[
              to("fieldName"),
              tb("fieldStatus"),
              tb("address"),
              tb("fieldSports"),
              tb("courtCount"),
              to("columns.actions"),
            ].map((heading) => (
              <TableHead
                key={heading || "edit"}
                className="text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase"
              >
                {heading}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((branch) => {
            const address = currentBranchAddress(branch)?.address_line_1?.trim();
            const sportsLabel = sportNames(sports, branch.sport_ids, locale);
            return (
              <TableRow key={branch.id} className={ROW}>
                <TableCell>
                  {branch.status === "archived" ? null : (
                    <Checkbox
                      checked={selected.has(branch.id)}
                      aria-label={to("selectRow")}
                      onCheckedChange={() => onToggle(branch.id)}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <EntityRelationLink href={`/branches/${branch.id}`}>
                    {branch.name}
                  </EntityRelationLink>
                </TableCell>
                <TableCell>
                  <SoftStatusChip
                    label={tb(`status.${branch.status}`)}
                    tone={BRANCH_STATUS_TONE[branch.status]}
                    size="sm"
                  />
                </TableCell>
                <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                  {address || tb("noAddress")}
                </TableCell>
                <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                  {sportsLabel || tb("emptyValue")}
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {t("courtCount", { count: branch.court_count ?? 0 })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <RowEditButton label={tb("editProfile")} onClick={() => onEdit(branch)} />
                    <BranchArchiveButton
                      organizationId={branch.organization_id}
                      branchId={branch.id}
                      name={branch.name}
                      status={branch.status}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
    </Table>
  );
}

function BranchCompactList({
  branches,
  sports,
  locale,
  onEdit,
  selected,
  onToggle,
}: {
  branches: Branch[];
  sports: Sport[];
  locale: string;
  onEdit: (branch: Branch) => void;
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const t = useTranslations("organization.detailBranches");
  const tb = useTranslations("organization.branch");
  const to = useTranslations("organization");

  return (
    <ul className="divide-y divide-border/40">
      {branches.map((branch) => {
        const address = currentBranchAddress(branch)?.address_line_1?.trim();
        const sportsLabel = sportNames(sports, branch.sport_ids, locale);
        const meta = [sportsLabel, t("courtCount", { count: branch.court_count ?? 0 })]
          .filter(Boolean)
          .join(" · ");
        return (
          <li key={branch.id} className="flex items-start gap-3 py-3">
            {branch.status === "archived" ? (
              <span className="size-4 shrink-0" aria-hidden />
            ) : (
              <Checkbox
                checked={selected.has(branch.id)}
                aria-label={to("selectRow")}
                className="mt-0.5"
                onCheckedChange={() => onToggle(branch.id)}
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <EntityRelationLink href={`/branches/${branch.id}`} className="min-w-0 truncate">
                  {branch.name}
                </EntityRelationLink>
                <SoftStatusChip
                  label={tb(`status.${branch.status}`)}
                  tone={BRANCH_STATUS_TONE[branch.status]}
                  size="sm"
                />
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {address || tb("noAddress")}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <RowEditButton label={tb("editProfile")} onClick={() => onEdit(branch)} />
              <BranchArchiveButton
                organizationId={branch.organization_id}
                branchId={branch.id}
                name={branch.name}
                status={branch.status}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function OrganizationBranchesView() {
  const t = useTranslations("organization.detailBranches");
  const tb = useTranslations("organization.branch");
  const to = useTranslations("organization");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const locale = useLocale();
  const { orgId } = useOrganizationDetail();
  const { data, isLoading, isError, refetch, isFetching } = useBranches(orgId);
  const archiveMany = useArchiveBranches(orgId);
  const selection = useBulkSelection();
  const { data: sports = [] } = useSports();
  const branches = data ?? [];
  const { mode, setMode } = useCollectionViewMode("branches");
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState(ALL);
  const [filterSport, setFilterSport] = useState(ALL);
  const [sheet, setSheet] = useState<
    null | { mode: "create" } | { mode: "edit"; branch: Branch }
  >(null);

  const openCreate = () => setSheet({ mode: "create" });
  const needle = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    return branches.filter((branch) => {
      if (filterStatus && branch.status !== filterStatus) return false;
      if (filterSport && !(branch.sport_ids ?? []).includes(filterSport)) return false;
      if (!needle) return true;
      const address = currentBranchAddress(branch);
      return includesQuery(
        [branch.name, branch.name_vi, branch.name_en, branch.code, address?.address_line_1, address?.address_line_2],
        needle,
      );
    });
  }, [branches, filterSport, filterStatus, needle]);
  const { pageItems, pagination } = useClientCollectionPage(
    filtered,
    `${needle}|${filterStatus}|${filterSport}`,
  );

  const statusOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: ALL, label: t("allStatuses"), keywords: "all" },
      ...BRANCH_STATUSES.map((status) => ({
        value: status,
        label: tb(`status.${status}`),
        keywords: status,
      })),
    ],
    [t, tb],
  );
  const sportOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: ALL, label: t("allSports"), keywords: "all" },
      ...sports.map((sport) => ({
        value: sport.id,
        label: sportLabel(sport, locale),
        keywords: `${sport.name_vi ?? ""} ${sport.name_en ?? ""}`,
      })),
    ],
    [locale, sports, t],
  );

  function addButton(placement: "header" | "empty" = "empty") {
    if (placement === "header") {
      return <SectionAddButton label={t("addBranch")} onClick={openCreate} />;
    }
    return (
      <Button type="button" size="sm" onClick={openCreate}>
        <Plus className="size-3.5" aria-hidden />
        {t("addBranch")}
      </Button>
    );
  }

  return (
    <>
      <div className={cn("flex flex-col px-0 pt-1 pb-3 md:px-6 md:pt-2", softDetailSectionGap)}>
        <EntityCollectionPanel
          title={t("title")}
          icon={<Building2 className="size-4" aria-hidden />}
          tone="sky"
          className="p-3 md:p-5"
          actions={
            <div className="flex items-center gap-2">
              <CollectionViewToggle mode={mode} onChange={setMode} />
              {addButton("header")}
            </div>
          }
          toolbar={
            branches.length > 0 ? (
              <>
                <FilterSearchField
                  value={query}
                  onChange={setQuery}
                  label={t("search")}
                  className="w-full min-w-0 sm:w-auto sm:min-w-[12rem] sm:flex-1"
                />
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                  <FilterSelect
                    value={filterStatus}
                    onValueChange={setFilterStatus}
                    options={statusOptions}
                    ariaLabel={t("filterStatus")}
                    className="w-full min-w-0 sm:w-auto sm:min-w-[8.5rem]"
                  />
                  <FilterSelect
                    value={filterSport}
                    onValueChange={setFilterSport}
                    options={sportOptions}
                    ariaLabel={t("filterSport")}
                    searchable
                    className="w-full min-w-0 sm:w-auto sm:min-w-[8.5rem]"
                  />
                </div>
              </>
            ) : null
          }
          pagination={
            !isLoading && !isError && filtered.length > 0 ? (
              <DataTablePagination
                {...pagination}
                className="bg-transparent px-0 md:px-0"
                leading={
                  <BulkDeleteBar
                    placement="footer"
                    count={selection.selected.length}
                    selectedLabel={to("bulkSelected", { count: selection.selected.length })}
                    deleteLabel={tb("delete")}
                    title={tb("bulkDeleteTitle", { count: selection.selected.length })}
                    description={tb("bulkDeleteConfirm", { count: selection.selected.length })}
                    cancelLabel={tb("cancel")}
                    pending={archiveMany.isPending}
                    onClear={selection.clear}
                    onConfirm={async () => {
                      let result;
                      try {
                        result = await archiveMany.mutateAsync(selection.selected);
                      } catch (err) {
                        const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
                        toast.error(te(errorMessageKey(apiErr)));
                        throw err;
                      }
                      selection.keep(result.failed.map((item) => item.id));
                      if (result.succeeded.length > 0) {
                        toast.success(tb("bulkDeleted", { count: result.succeeded.length }));
                      }
                      if (result.failed.length > 0) {
                        toast.error(to("bulkFailed", { count: result.failed.length }));
                      }
                    }}
                  />
                }
              />
            ) : null
          }
        >
          {isLoading ? <DataTableSkeleton rows={4} columns={5} className="px-0" /> : null}
          {isError ? (
            <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{tb("loadError")}</p>
              <Button variant="outline" size="lg" onClick={() => void refetch()} disabled={isFetching}>
                {tc("retry")}
              </Button>
            </div>
          ) : null}
          {!isLoading && !isError && filtered.length === 0 ? (
            <DataListEmpty
              className="py-10"
              title={branches.length === 0 ? tb("empty") : t("emptyFiltered")}
              action={branches.length === 0 ? addButton() : undefined}
            />
          ) : null}
          {!isLoading && !isError && filtered.length > 0 && mode === "grid" ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {pageItems.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  orgId={orgId}
                  sports={sports}
                  onEdit={(item) => setSheet({ mode: "edit", branch: item })}
                  selected={selection.selectedSet.has(branch.id)}
                  selectLabel={to("selectRow")}
                  onSelectedChange={
                    branch.status === "archived" ? undefined : () => selection.toggle(branch.id)
                  }
                />
              ))}
            </div>
          ) : null}
          {!isLoading && !isError && filtered.length > 0 && mode === "list" ? (
            <>
              <div className="lg:hidden">
                <BranchCompactList
                  branches={pageItems}
                  sports={sports}
                  locale={locale}
                  onEdit={(item) => setSheet({ mode: "edit", branch: item })}
                  selected={selection.selectedSet}
                  onToggle={selection.toggle}
                />
              </div>
              <div className="hidden lg:block">
                <BranchList
                  branches={pageItems}
                  sports={sports}
                  locale={locale}
                  onEdit={(item) => setSheet({ mode: "edit", branch: item })}
                  selected={selection.selectedSet}
                  pageSelected={pageItems
                    .filter((branch) => branch.status !== "archived")
                    .every((branch) => selection.selectedSet.has(branch.id)) &&
                    pageItems.some((branch) => branch.status !== "archived")}
                  onToggle={selection.toggle}
                  onTogglePage={selection.toggleMany}
                />
              </div>
            </>
          ) : null}
        </EntityCollectionPanel>
      </div>
      <BranchFormSheet
        open={sheet !== null}
        onOpenChange={(open) => {
          if (!open) setSheet(null);
        }}
        organizationId={orgId}
        {...(sheet?.mode === "edit"
          ? { mode: "edit" as const, branch: sheet.branch }
          : { mode: "create" as const })}
      />
    </>
  );
}
