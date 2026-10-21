"use client";

import { Card, CardContent } from "@bokdy/ui";
import type {
  PaginationState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { DATA_LIST_PAGE_SIZE, DataTable } from "@/components/data-list";
import {
  displayName,
  useUserColumns,
  type UserRow,
} from "@/components/users/shared/user-columns";
import { UserStatusBadge } from "@/components/users/shared/user-status-badge";
import { Link } from "@/i18n/navigation";
import type { UserAudience } from "@/lib/api/admin-users";

type UserListProps = {
  audience: UserAudience;
  users: UserRow[];
  hasFilters: boolean;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
};

export function UserList({
  audience,
  users,
  hasFilters,
  isLoading,
  isError,
  isFetching,
  onRetry,
}: UserListProps) {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const td = useTranslations("dataList");
  const columns = useUserColumns(audience);
  const base = `/users/${audience}`;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DATA_LIST_PAGE_SIZE,
  });

  const sortedForMobile = useMemo(() => {
    const sort = sorting[0];
    if (!sort) return users;
    const dir = sort.desc ? -1 : 1;
    return [...users].sort((a, b) => {
      if (sort.id === "user") {
        return displayName(a).localeCompare(displayName(b)) * dir;
      }
      if (sort.id === "status") {
        return a.status.localeCompare(b.status) * dir;
      }
      if (sort.id === "last_login") {
        return (
          ((a.last_login_at ?? "").localeCompare(b.last_login_at ?? "") || 0) *
          dir
        );
      }
      return 0;
    });
  }, [users, sorting]);

  const pageUsers = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    return sortedForMobile.slice(start, start + pagination.pageSize);
  }, [sortedForMobile, pagination]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataTable
        columns={columns}
        data={users}
        getRowId={(row) => row.id}
        sorting={sorting}
        onSortingChange={setSorting}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageSize={DATA_LIST_PAGE_SIZE}
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
        mobileList={
          <div className="space-y-3 p-4">
            {pageUsers.map((user) => (
              <UserCard key={user.id} user={user} href={`${base}/${user.id}`} />
            ))}
          </div>
        }
      />
    </div>
  );
}

function UserCard({ user, href }: { user: UserRow; href: string }) {
  return (
    <Link href={href} className="block">
      <Card className="soft-elevated border-border/40 shadow-none">
        <CardContent className="space-y-3 p-4">
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{displayName(user)}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <UserStatusBadge status={user.status} />
        </CardContent>
      </Card>
    </Link>
  );
}
