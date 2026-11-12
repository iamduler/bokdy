"use client";

import { Spinner } from "@bokdy/ui";
import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { DATA_LIST_PAGE_SIZE } from "@/components/data-list";
import { usePageShellTitle } from "@/components/shell/shell-title";
import { UserAccountFormSheet } from "@/components/users/user-account-form-sheet";
import { UserDirectoryToolbar } from "@/components/users/user-directory-toolbar";
import { UserList } from "@/components/users/shared/user-list";
import { useAdminUserList, useAdminUserStats } from "@/hooks/use-admin-users";
import { useRouter } from "@/i18n/navigation";
import type { UserAudience, UserStatus } from "@/lib/api/admin-users";
import {
  applySearchUpdates,
  queryFromSorting,
  readListPage,
  sortingFromQuery,
} from "@/lib/api/list-page";

const USER_STATUSES = new Set<UserStatus>([
  "active",
  "suspended",
  "pending",
  "locked",
]);

function parseStatus(raw: string | null): UserStatus | "" {
  if (!raw) return "";
  return USER_STATUSES.has(raw as UserStatus) ? (raw as UserStatus) : "";
}

const USER_SORTS = new Set(["created_at", "name", "status", "last_login"]);

const USER_SORT_BY_COLUMN: Record<string, string> = {
  user: "name",
  status: "status",
  last_login: "last_login",
};

const USER_COLUMN_BY_SORT: Record<string, string> = {
  name: "user",
  status: "status",
  last_login: "last_login",
};

const PAGE_TITLE_KEY: Record<
  UserAudience,
  "usersPlayers" | "usersOwners" | "usersAdmins"
> = {
  players: "usersPlayers",
  owners: "usersOwners",
  admins: "usersAdmins",
};

function UserDirectoryPageContent({ audience }: { audience: UserAudience }) {
  const t = useTranslations("users");
  const ts = useTranslations("shell");
  usePageShellTitle(ts(`pageTitles.${PAGE_TITLE_KEY[audience]}`));
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const status = parseStatus(searchParams.get("status"));
  const emailVerifiedRaw = searchParams.get("email_verified") ?? "";
  const staffRole = (searchParams.get("staff_role") ?? "") as
    | ""
    | "org_owner"
    | "org_staff";
  const [search, setSearch] = useState(q);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  const replaceParams = useCallback(
    (updates: Record<string, string | undefined>, resetOffset = true) => {
      const qs = applySearchUpdates(searchParams, updates, resetOffset);
      router.replace(qs ? `/users/${audience}?${qs}` : `/users/${audience}`);
    },
    [audience, router, searchParams],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = search.trim();
      if (trimmed === q.trim()) return;
      replaceParams({ q: trimmed || undefined });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, q, replaceParams]);

  const page = readListPage(searchParams, DATA_LIST_PAGE_SIZE);
  const sort = USER_SORTS.has(page.sort) ? page.sort : undefined;
  const order = sort ? (page.order ?? "desc") : undefined;
  const sorting = sortingFromQuery(sort ?? "", order, USER_COLUMN_BY_SORT);

  const listParams = {
    q: q.trim() || undefined,
    status: status || undefined,
    email_verified:
      emailVerifiedRaw === "true"
        ? true
        : emailVerifiedRaw === "false"
          ? false
          : undefined,
    staff_role: staffRole || undefined,
    limit: DATA_LIST_PAGE_SIZE,
    offset: page.offset,
    sort,
    order,
  };

  const hasFilters = Boolean(q.trim() || status || emailVerifiedRaw || staffRole);

  const { data, isLoading, isError, refetch, isFetching } = useAdminUserList(
    audience,
    listParams,
  );
  const statsQuery = useAdminUserStats(audience);
  const [creating, setCreating] = useState(false);
  const users = data?.items ?? [];
  const total = data?.total ?? 0;

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const query = queryFromSorting(next, USER_SORT_BY_COLUMN);
    replaceParams({ sort: query.sort, order: query.order }, true);
  };

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next =
      typeof updater === "function"
        ? updater({ pageIndex: page.pageIndex, pageSize: DATA_LIST_PAGE_SIZE })
        : updater;
    const offset = next.pageIndex * DATA_LIST_PAGE_SIZE;
    replaceParams({ offset: offset > 0 ? String(offset) : undefined }, false);
  };

  return (
    <div className="flex min-h-full flex-col overflow-hidden">
      <UserDirectoryToolbar
        audience={audience}
        status={status}
        emailVerifiedRaw={emailVerifiedRaw}
        staffRole={staffRole}
        search={search}
        onSearchChange={setSearch}
        onReplaceParams={replaceParams}
        stats={statsQuery.data}
        statsLoading={statsQuery.isLoading}
        onCreate={() => setCreating(true)}
      >
        <UserList
          audience={audience}
          users={users}
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
        />
      </UserDirectoryToolbar>
      <UserAccountFormSheet
        open={creating}
        mode="create"
        audience={audience}
        onOpenChange={(open) => {
          if (!open) setCreating(false);
        }}
      />
    </div>
  );
}

export function UserDirectoryPage({ audience }: { audience: UserAudience }) {
  const tc = useTranslations("common");
  return (
    <Suspense
      fallback={<p className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><Spinner />{tc("loading")}</p>}
    >
      <UserDirectoryPageContent audience={audience} />
    </Suspense>
  );
}
