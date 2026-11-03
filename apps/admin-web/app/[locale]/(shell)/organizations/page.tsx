"use client";

import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";

import { DATA_LIST_PAGE_SIZE } from "@/components/data-list";
import { organizationDirectoryStatsFromApi } from "@/components/organizations/organization-directory-stats";
import { OrganizationDirectoryToolbar } from "@/components/organizations/organization-directory-toolbar";
import { OrganizationList } from "@/components/organizations/organization-list";
import { usePageShellTitle } from "@/components/shell/shell-title";
import {
  useAdminOrganizations,
  useOrganizationDirectoryStats,
} from "@/hooks/use-admin-organizations";
import { useRouter } from "@/i18n/navigation";
import type { OrgStatus } from "@/lib/api/admin";
import {
  applySearchUpdates,
  queryFromSorting,
  readListPage,
  sortingFromQuery,
} from "@/lib/api/list-page";

const ORG_STATUSES = new Set<OrgStatus>([
  "active",
  "inactive",
  "suspended",
  "archived",
]);

const ORG_SORTS = new Set(["created_at", "name", "status", "branch_count", "court_count"]);

const ORG_SORT_BY_COLUMN: Record<string, string> = {
  name: "name",
  branches: "branch_count",
  courts: "court_count",
  status: "status",
};

const ORG_COLUMN_BY_SORT: Record<string, string> = {
  name: "name",
  branch_count: "branches",
  court_count: "courts",
  status: "status",
};

function parseStatus(raw: string | null): OrgStatus | "" {
  if (!raw) return "";
  return ORG_STATUSES.has(raw as OrgStatus) ? (raw as OrgStatus) : "";
}

function OrganizationsPageContent() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.organizations"));
  const router = useRouter();
  const searchParams = useSearchParams();
  const openCreate = () => router.push("/organizations/new");

  const q = searchParams.get("q") ?? "";
  const status = parseStatus(searchParams.get("status"));
  const provinceId = searchParams.get("province_id") ?? "";
  const hasFilters = Boolean(q.trim() || status || provinceId);
  const page = readListPage(searchParams, DATA_LIST_PAGE_SIZE);
  const sort = ORG_SORTS.has(page.sort) ? page.sort : undefined;
  const order = sort ? (page.order ?? "desc") : undefined;

  const replaceListParams = useCallback(
    (updates: Record<string, string | undefined>, resetOffset = false) => {
      const qs = applySearchUpdates(searchParams, updates, resetOffset);
      router.replace(qs ? `/organizations?${qs}` : "/organizations");
    },
    [router, searchParams],
  );

  const params = {
    q: q.trim() || undefined,
    status: status || undefined,
    province_id: provinceId || undefined,
    limit: DATA_LIST_PAGE_SIZE,
    offset: page.offset,
    sort,
    order,
  };

  const { data, isLoading, isError, refetch, isFetching } =
    useAdminOrganizations(params);
  const statsQuery = useOrganizationDirectoryStats({
    q: q.trim() || undefined,
    province_id: provinceId || undefined,
  });
  const orgs = data?.items ?? [];
  const total = data?.total ?? 0;
  const sorting = sortingFromQuery(sort ?? "", order, ORG_COLUMN_BY_SORT);
  const directoryStats = organizationDirectoryStatsFromApi(statsQuery.data);

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const query = queryFromSorting(next, ORG_SORT_BY_COLUMN);
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
      <OrganizationDirectoryToolbar
        q={q}
        status={status}
        provinceId={provinceId}
        directoryStats={directoryStats}
        statsLoading={statsQuery.isLoading}
        onOpenCreate={openCreate}
      >
        <OrganizationList
          orgs={orgs}
          total={total}
          pageIndex={page.pageIndex}
          sorting={sorting}
          onSortingChange={onSortingChange}
          onPaginationChange={onPaginationChange}
          hasFilters={hasFilters}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          onRetry={() => void refetch()}
          onOpenCreate={openCreate}
        />
      </OrganizationDirectoryToolbar>
    </div>
  );
}

export default function OrganizationsPage() {
  const tc = useTranslations("common");

  return (
    <Suspense
      fallback={
        <p className="p-4 text-sm text-muted-foreground">{tc("loading")}</p>
      }
    >
      <OrganizationsPageContent />
    </Suspense>
  );
}
