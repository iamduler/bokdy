"use client";

import {
  Button,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bokdy/ui";
import { Pencil, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { sportLabel } from "@/components/branches/branch-sports-chips";
import { BRANCH_STATUS_TONE } from "@/components/branches/branch-status";
import { DataListEmpty, softDirectoryPrimaryBtn } from "@/components/data-list";
import { FilterSearchField } from "@/components/data-list/filter-search-field";
import { FilterSelect } from "@/components/data-list/filter-select";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import {
  EntityDetailError,
  EntityDetailLoading,
} from "@/components/entity/detail-state";
import { EntityRelationLink } from "@/components/entity/relation-link";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { CollectionViewToggle } from "@/components/entity/collection-view-toggle";
import { useCollectionViewMode } from "@/components/entity/use-collection-view-mode";
import { OrganizationSectionFrame } from "@/components/organizations/detail/organization-section-frame";
import { useOrganizationDetail } from "@/components/organizations/detail/organization-detail-context";
import { type PopoverCommandOption } from "@/components/popover-command-select";
import { useBranches } from "@/hooks/use-branches";
import { useSports } from "@/hooks/use-sports";
import { currentBranchAddress, type Branch, type BranchStatus } from "@/lib/api/branches";
import { ApiError } from "@/lib/api/errors";
import type { Sport } from "@/lib/api/sports";

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
}: {
  branches: Branch[];
  sports: Sport[];
  locale: string;
  onEdit: (branch: Branch) => void;
}) {
  const t = useTranslations("organization.detailBranches");
  const tb = useTranslations("organization.branch");
  const to = useTranslations("organization");

  return (
    <EntityDetailPanel className="min-w-0 overflow-hidden">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow className="border-border/40 hover:bg-transparent">
            {[
              to("fieldName"),
              tb("fieldStatus"),
              tb("address"),
              tb("fieldSports"),
              tb("courtCount"),
              "",
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={tb("editProfile")}
                    onClick={() => onEdit(branch)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </EntityDetailPanel>
  );
}

export function OrganizationBranchesView() {
  const t = useTranslations("organization.detailBranches");
  const tb = useTranslations("organization.branch");
  const to = useTranslations("organization");
  const ts = useTranslations("shell");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { orgId } = useOrganizationDetail();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useBranches(orgId);
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
  const filtering = needle !== "" || filterStatus !== ALL || filterSport !== ALL;

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

  return (
    <>
      <OrganizationSectionFrame
        title={t("title")}
        subtitle={
          filtering
            ? t("subtitleFiltered", { shown: filtered.length, total: branches.length })
            : to("branchCount", { count: branches.length })
        }
        toolbar={
          branches.length > 0 ? (
            <>
              <FilterSearchField value={query} onChange={setQuery} label={t("search")} />
              <FilterSelect
                value={filterStatus}
                onValueChange={setFilterStatus}
                options={statusOptions}
                ariaLabel={t("filterStatus")}
              />
              <FilterSelect
                value={filterSport}
                onValueChange={setFilterSport}
                options={sportOptions}
                ariaLabel={t("filterSport")}
                searchable
              />
            </>
          ) : null
        }
        actions={
          <>
            <CollectionViewToggle mode={mode} onChange={setMode} />
            <Button
              type="button"
              size="lg"
              className={softDirectoryPrimaryBtn}
              onClick={openCreate}
            >
              <Plus className="size-4" />
              {t("addBranch")}
            </Button>
          </>
        }
      >
        {isLoading ? <EntityDetailLoading label={tc("loading")} /> : null}
        {isError ? (
          <EntityDetailError
            message={tb("loadError")}
            notFound={error instanceof ApiError && error.status === 404}
            retryLabel={tc("retry")}
            onRetry={() => refetch()}
            retryDisabled={isFetching}
            backHref={`/organizations/${orgId}`}
            backLabel={ts("menuBack")}
          />
        ) : null}
        {!isLoading && !isError && filtered.length === 0 ? (
          <DataListEmpty
            className="flex-none py-8"
            title={branches.length === 0 ? tb("empty") : t("emptyFiltered")}
            description={branches.length === 0 ? t("emptyHint") : undefined}
            action={
              branches.length === 0 ? (
                <Button
                  type="button"
                  size="lg"
                  className={cn("mt-3", softDirectoryPrimaryBtn)}
                  onClick={openCreate}
                >
                  <Plus className="size-4" />
                  {t("addBranch")}
                </Button>
              ) : undefined
            }
          />
        ) : null}
        {!isLoading && !isError && filtered.length > 0 && mode === "grid" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((branch) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                orgId={orgId}
                sports={sports}
                onEdit={(item) => setSheet({ mode: "edit", branch: item })}
              />
            ))}
          </div>
        ) : null}
        {!isLoading && !isError && filtered.length > 0 && mode === "list" ? (
          <BranchList
            branches={filtered}
            sports={sports}
            locale={locale}
            onEdit={(item) => setSheet({ mode: "edit", branch: item })}
          />
        ) : null}
      </OrganizationSectionFrame>
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
