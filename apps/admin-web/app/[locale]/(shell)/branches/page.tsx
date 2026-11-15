"use client";

import { Spinner } from "@bokdy/ui";
import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";

import { BranchDirectoryList } from "@/components/branches/branch-directory-list";
import { BranchDirectoryToolbar } from "@/components/branches/branch-directory-toolbar";
import { DATA_LIST_PAGE_SIZE } from "@/components/data-list";
import { usePageShellTitle } from "@/components/shell/shell-title";
import { useAdminBranchDirectoryStats, useAdminBranches } from "@/hooks/use-admin-branches";
import { useRouter } from "@/i18n/navigation";
import type { AdminBranchStatus } from "@/lib/api/admin-branches";
import {
  applySearchUpdates,
  queryFromSorting,
  readListPage,
  sortingFromQuery,
} from "@/lib/api/list-page";

const STATUSES = new Set<AdminBranchStatus>(["active", "inactive", "maintenance", "archived"]);
const SORTS = new Set(["created_at", "name", "status", "court_count"]);
const SORT_BY_COLUMN: Record<string, string> = {
  name: "name",
  courts: "court_count",
  status: "status",
};
const COLUMN_BY_SORT: Record<string, string> = {
  name: "name",
  court_count: "courts",
  status: "status",
};

function parseStatus(raw: string | null): AdminBranchStatus | "" {
  if (!raw) return "";
  return STATUSES.has(raw as AdminBranchStatus) ? (raw as AdminBranchStatus) : "";
}

function BranchesPageContent() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.branches"));
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const status = parseStatus(searchParams.get("status"));
  const provinceId = searchParams.get("province_id") ?? "";
  const organizationId = searchParams.get("organization_id") ?? "";
  const sportId = searchParams.get("sport_id") ?? "";
  const hasFilters = Boolean(q.trim() || status || provinceId || organizationId || sportId);
  const page = readListPage(searchParams, DATA_LIST_PAGE_SIZE);
  const sort = SORTS.has(page.sort) ? page.sort : undefined;
  const order = sort ? (page.order ?? "desc") : undefined;

  const replaceListParams = useCallback(
    (updates: Record<string, string | undefined>, resetOffset = false) => {
      const qs = applySearchUpdates(searchParams, updates, resetOffset);
      router.replace(qs ? `/branches?${qs}` : "/branches");
    },
    [router, searchParams],
  );

  const params = {
    q: q.trim() || undefined,
    status: status || undefined,
    province_id: provinceId || undefined,
    organization_id: organizationId || undefined,
    sport_id: sportId || undefined,
    limit: DATA_LIST_PAGE_SIZE,
    offset: page.offset,
    sort,
    order,
  };
  const { data, isLoading, isError, refetch, isFetching } = useAdminBranches(params);
  const statsQuery = useAdminBranchDirectoryStats({
    q: q.trim() || undefined,
    province_id: provinceId || undefined,
    organization_id: organizationId || undefined,
    sport_id: sportId || undefined,
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
      <BranchDirectoryToolbar
        q={q}
        status={status}
        provinceId={provinceId}
        organizationId={organizationId}
        sportId={sportId}
        stats={statsQuery.data}
        statsLoading={statsQuery.isLoading}
      >
        <BranchDirectoryList
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
      </BranchDirectoryToolbar>
    </div>
  );
}

export default function BranchesPage() {
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
      <BranchesPageContent />
    </Suspense>
  );
}
