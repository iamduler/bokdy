"use client";

import { Card, CardContent } from "@bokdy/ui";
import type { OnChangeFn, PaginationState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useState } from "react";

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
};

export function UserList({
  audience,
  users,
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
}: UserListProps) {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const td = useTranslations("dataList");
  const columns = useUserColumns(audience);
  const base = `/users/${audience}`;
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataTable
        columns={columns}
        data={users}
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
        mobileList={
          users.length === 0 ? undefined : (
            <div className="space-y-3 p-4">
              {users.map((user) => (
                <UserCard key={user.id} user={user} href={`${base}/${user.id}`} />
              ))}
            </div>
          )
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
