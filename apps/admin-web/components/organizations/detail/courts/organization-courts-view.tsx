"use client";

import { Button, cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@bokdy/ui";
import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { sportLabel } from "@/components/branches/branch-sports-chips";
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
import { CourtCard } from "@/components/courts/court-card";
import { CourtFormSheet } from "@/components/courts/court-form-sheet";
import { COURT_STATUS_TONE } from "@/components/courts/court-status";
import { CollectionViewToggle } from "@/components/entity/collection-view-toggle";
import { OrganizationSectionFrame } from "@/components/organizations/detail/organization-section-frame";
import { useCollectionViewMode } from "@/components/entity/use-collection-view-mode";
import { type PopoverCommandOption } from "@/components/popover-command-select";
import { useBranches } from "@/hooks/use-branches";
import { useOrgCourts } from "@/hooks/use-courts";
import { useSports } from "@/hooks/use-sports";
import type { Court, CourtEnvironment, CourtStatus } from "@/lib/api/courts";
import { ApiError } from "@/lib/api/errors";

import { useOrganizationDetail } from "../organization-detail-context";

const ALL = "";
const ROW = "border-border/40 hover:bg-muted/30";

function CourtList({
  courts,
  branchName,
}: {
  courts: Court[];
  branchName: Map<string, string>;
}) {
  const t = useTranslations("organization.court");
  const to = useTranslations("organization");
  const locale = useLocale();
  const { data: sports = [] } = useSports();
  const headings = [
    to("fieldName"),
    t("fieldStatus"),
    t("cardSport"),
    t("cardSurface"),
    t("cardEnvironment"),
    t("cardBranch"),
  ];

  return (
    <EntityDetailPanel className="min-w-0 overflow-hidden">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow className="border-border/40 hover:bg-transparent">
            {headings.map((heading) => (
              <TableHead
                key={heading}
                className="text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase"
              >
                {heading}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {courts.map((court) => {
            const sport = sports.find((item) => item.id === court.sport_id);
            const env = court.environment ?? "unspecified";
            const surface = court.surface ?? "unspecified";
            return (
              <TableRow key={court.id} className={ROW}>
                <TableCell>
                  <EntityRelationLink href={`/courts/${court.id}`}>
                    {court.name}
                  </EntityRelationLink>
                </TableCell>
                <TableCell>
                  <SoftStatusChip
                    label={t(`status.${court.status}`)}
                    tone={COURT_STATUS_TONE[court.status]}
                    size="sm"
                  />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {sport ? sportLabel(sport, locale) : t("emptyValue")}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {t(`surface.${surface}`)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {t(`environment.${env}`)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {branchName.get(court.branch_id) || t("emptyValue")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </EntityDetailPanel>
  );
}

export function OrganizationCourtsView() {
  const t = useTranslations("organization.detailCourts");
  const tc = useTranslations("organization.court");
  const tCommon = useTranslations("common");
  const ts = useTranslations("shell");
  const { orgId } = useOrganizationDetail();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useOrgCourts(orgId);
  const { data: branches = [] } = useBranches(orgId);
  const courts = data ?? [];

  const [query, setQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState(ALL);
  const [filterStatus, setFilterStatus] = useState(ALL);
  const [filterEnv, setFilterEnv] = useState(ALL);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { mode, setMode } = useCollectionViewMode("courts");

  const branchName = useMemo(
    () => new Map(branches.map((b) => [b.id, b.name])),
    [branches],
  );

  const needle = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    return courts.filter((court) => {
      if (needle) {
        const haystack = [court.name, court.name_vi, court.name_en, court.code]
          .filter((part): part is string => Boolean(part))
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (filterBranch && court.branch_id !== filterBranch) return false;
      if (filterStatus && court.status !== filterStatus) return false;
      if (filterEnv && (court.environment ?? "unspecified") !== filterEnv)
        return false;
      return true;
    });
  }, [courts, filterBranch, filterEnv, filterStatus, needle]);

  const filtering =
    needle !== "" || filterBranch !== ALL || filterStatus !== ALL || filterEnv !== ALL;

  const branchOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: ALL, label: t("allBranches"), keywords: "all" },
      ...branches.map((branch) => ({
        value: branch.id,
        label: branch.name,
        keywords: `${branch.code} ${branch.name}`,
      })),
    ],
    [branches, t],
  );

  const statusOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: ALL, label: t("allStatuses"), keywords: "all" },
      ...(
        ["active", "inactive", "maintenance", "archived"] as CourtStatus[]
      ).map((status) => ({
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
      ...(["indoor", "outdoor", "unspecified"] as CourtEnvironment[]).map(
        (env) => ({
          value: env,
          label: tc(`environment.${env}`),
          keywords: env,
        }),
      ),
    ],
    [t, tc],
  );

  return (
    <>
      <OrganizationSectionFrame
        title={t("title")}
        subtitle={
          filtering
            ? t("subtitleFiltered", { shown: filtered.length, total: courts.length })
            : t("subtitle", { total: courts.length })
        }
        hint={t("emptyHint")}
        toolbar={
          courts.length > 0 ? (
          <>
            <FilterSearchField
              value={query}
              onChange={setQuery}
              label={t("search")}
            />
            <FilterSelect
              value={filterBranch}
              onValueChange={setFilterBranch}
              options={branchOptions}
              ariaLabel={t("filterBranch")}
              searchable
            />
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
        actions={
          <>
            <CollectionViewToggle mode={mode} onChange={setMode} />
            <Button
              type="button"
              size="lg"
              className={softDirectoryPrimaryBtn}
              onClick={() => setSheetOpen(true)}
            >
              <Plus className="size-4" />
              {t("addCourt")}
            </Button>
          </>
        }
      >
        {isLoading ? <EntityDetailLoading label={tCommon("loading")} /> : null}
        {isError ? (
          <EntityDetailError
            message={tc("loadError")}
            notFound={error instanceof ApiError && error.status === 404}
            retryLabel={tCommon("retry")}
            onRetry={() => void refetch()}
            retryDisabled={isFetching}
            backHref={`/organizations/${orgId}`}
            backLabel={ts("menuBack")}
          />
        ) : null}
        {!isLoading && !isError && filtered.length === 0 ? (
          <DataListEmpty
            className="flex-none py-8"
            title={courts.length === 0 ? tc("empty") : t("emptyFiltered")}
            action={
              courts.length === 0 ? (
                <Button
                  type="button"
                  size="lg"
                  className={cn("mt-3", softDirectoryPrimaryBtn)}
                  onClick={() => setSheetOpen(true)}
                >
                  <Plus className="size-4" />
                  {t("addCourt")}
                </Button>
              ) : undefined
            }
          />
        ) : null}
        {!isLoading && !isError && filtered.length > 0 && mode === "grid" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((court: Court) => (
              <CourtCard
                key={court.id}
                court={court}
                branchName={branchName.get(court.branch_id)}
              />
            ))}
          </div>
        ) : null}
        {!isLoading && !isError && filtered.length > 0 && mode === "list" ? (
          <CourtList courts={filtered} branchName={branchName} />
        ) : null}
      </OrganizationSectionFrame>

      <CourtFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        organizationId={orgId}
        mode="create"
      />
    </>
  );
}
