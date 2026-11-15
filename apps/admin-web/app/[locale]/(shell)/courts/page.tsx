"use client";

import { Spinner } from "@bokdy/ui";
import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";

import { CourtDirectoryList } from "@/components/courts/court-directory-list";
import { CourtDirectoryToolbar } from "@/components/courts/court-directory-toolbar";
import { DATA_LIST_PAGE_SIZE } from "@/components/data-list";
import { usePageShellTitle } from "@/components/shell/shell-title";
import { useAdminCourtDirectoryStats, useAdminCourts } from "@/hooks/use-admin-courts";
import { useRouter } from "@/i18n/navigation";
import type { AdminCourtEnvironment, AdminCourtStatus, AdminCourtSurface } from "@/lib/api/admin-courts";
import {
  applySearchUpdates,
  queryFromSorting,
  readListPage,
  sortingFromQuery,
} from "@/lib/api/list-page";

const STATUSES = new Set<AdminCourtStatus>(["active", "inactive", "maintenance", "archived"]);
const ENVIRONMENTS = new Set<AdminCourtEnvironment>(["indoor", "outdoor", "unspecified"]);
const SURFACES = new Set<AdminCourtSurface>([
  "unspecified",
  "pvc",
  "wood",
  "hard_court",
  "grass",
  "artificial_turf",
  "clay",
  "rubber",
  "other",
]);
const SORTS = new Set(["created_at", "name", "status"]);
const SORT_BY_COLUMN: Record<string, string> = { name: "name", status: "status" };
const COLUMN_BY_SORT: Record<string, string> = { name: "name", status: "status" };

function parseStatus(raw: string | null): AdminCourtStatus | "" {
  if (!raw) return "";
  return STATUSES.has(raw as AdminCourtStatus) ? (raw as AdminCourtStatus) : "";
}

function parseEnvironment(raw: string | null): AdminCourtEnvironment | "" {
  if (!raw) return "";
  return ENVIRONMENTS.has(raw as AdminCourtEnvironment) ? (raw as AdminCourtEnvironment) : "";
}

function parseSurface(raw: string | null): AdminCourtSurface | "" {
  if (!raw) return "";
  return SURFACES.has(raw as AdminCourtSurface) ? (raw as AdminCourtSurface) : "";
}

function CourtsPageContent() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.courts"));
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const status = parseStatus(searchParams.get("status"));
  const sportId = searchParams.get("sport_id") ?? "";
  const environment = parseEnvironment(searchParams.get("environment"));
  const organizationId = searchParams.get("organization_id") ?? "";
  const branchId = searchParams.get("branch_id") ?? "";
  const surface = parseSurface(searchParams.get("surface"));
  const hasFilters = Boolean(
    q.trim() || status || sportId || environment || organizationId || branchId || surface,
  );
  const page = readListPage(searchParams, DATA_LIST_PAGE_SIZE);
  const sort = SORTS.has(page.sort) ? page.sort : undefined;
  const order = sort ? (page.order ?? "desc") : undefined;

  const replaceListParams = useCallback(
    (updates: Record<string, string | undefined>, resetOffset = false) => {
      const qs = applySearchUpdates(searchParams, updates, resetOffset);
      router.replace(qs ? `/courts?${qs}` : "/courts");
    },
    [router, searchParams],
  );

  const params = {
    q: q.trim() || undefined,
    status: status || undefined,
    sport_id: sportId || undefined,
    environment: environment || undefined,
    organization_id: organizationId || undefined,
    branch_id: branchId || undefined,
    surface: surface || undefined,
    limit: DATA_LIST_PAGE_SIZE,
    offset: page.offset,
    sort,
    order,
  };
  const { data, isLoading, isError, refetch, isFetching } = useAdminCourts(params);
  const statsQuery = useAdminCourtDirectoryStats({
    q: q.trim() || undefined,
    sport_id: sportId || undefined,
    environment: environment || undefined,
    organization_id: organizationId || undefined,
    branch_id: branchId || undefined,
    surface: surface || undefined,
  });
  const sorting = sortingFromQuery(sort ?? "", order, COLUMN_BY_SORT);

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const query = queryFromSorting(next, SORT_BY_COLUMN);
    replaceListParams({ sort: query.sort, order: query.order }, true);
  };
  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next =
      typeof updater === "function"
        ? updater({ pageIndex: page.pageIndex, pageSize: DATA_LIST_PAGE_SIZE })
        : updater;
    const offset = next.pageIndex * DATA_LIST_PAGE_SIZE;
    replaceListParams({ offset: offset > 0 ? String(offset) : undefined });
  };

  return (
    <div className="flex min-h-full flex-col overflow-hidden">
      <CourtDirectoryToolbar
        q={q}
        status={status}
        sportId={sportId}
        environment={environment}
        organizationId={organizationId}
        branchId={branchId}
        surface={surface}
        stats={statsQuery.data}
        statsLoading={statsQuery.isLoading}
      >
        <CourtDirectoryList
          rows={data?.items ?? []}
          total={data?.total ?? 0}
          pageIndex={page.pageIndex}
          sorting={sorting}
          onSortingChange={onSortingChange}
          onPaginationChange={onPaginationChange}
          hasFilters={hasFilters}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          onRetry={() => void refetch()}
        />
      </CourtDirectoryToolbar>
    </div>
  );
}

export default function CourtsPage() {
  const tc = useTranslations("common");
  return (
    <Suspense
      fallback={
        <p className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <Spinner />
          {tc("loading")}
        </p>
      }
    >
      <CourtsPageContent />
    </Suspense>
  );
}
