"use client";

import { Button, Card, CardContent, formatUserDateTime, Tooltip, TooltipContent, TooltipTrigger, useUserDateTimePrefs } from "@bokdy/ui";
import type { OnChangeFn, PaginationState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { Ban, Eye, RotateCcw, UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DATA_LIST_PAGE_SIZE, DataTable } from "@/components/data-list";
import { EntityAvatar, entityFileSrc } from "@/components/entity/avatar";
import { RowEditButton } from "@/components/entity/row-edit-button";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { UserSuspendDialog } from "@/components/users/detail/user-suspend-dialog";
import {
  displayName,
  useUserColumns,
  type UserRow,
} from "@/components/users/shared/user-columns";
import { UserStatusBadge } from "@/components/users/shared/user-status-badge";
import { useActivateUser, useRestoreUser } from "@/hooks/use-admin-users";
import { Link } from "@/i18n/navigation";
import type { AdminOwnerUser, UserAudience } from "@/lib/api/admin-users";
import { staffRoleLabel } from "@/lib/users/staff-role-label";

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
                <UserCard key={user.id} user={user} href={`${base}/${user.id}`} audience={audience} />
              ))}
            </div>
          )
        }
      />
    </div>
  );
}

function UserCard({
  user,
  href,
  audience,
}: {
  user: UserRow;
  href: string;
  audience: UserAudience;
}) {
  const t = useTranslations("users");
  const td = useTranslations("users.detail");
  const prefs = useUserDateTimePrefs();
  const restore = useRestoreUser();
  const activate = useActivateUser();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const name = displayName(user);
  const owner = audience === "owners" ? (user as AdminOwnerUser) : null;
  const verified = Boolean(user.email_verified_at);
  const phone = user.phone?.trim() ?? "";

  return (
    <>
      <Card className="soft-elevated border-border/40 shadow-none">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <Link href={href} className="flex min-w-0 flex-1 items-start gap-3">
              <EntityAvatar name={name} size="sm" src={entityFileSrc(user.avatar_file_id)} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                {phone ? <p className="truncate text-xs text-muted-foreground">{phone}</p> : null}
              </div>
            </Link>
            <div className="flex shrink-0 items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" size="icon-sm" aria-label={t("viewDetail")}>
                    <Link href={href}>
                      <Eye className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("viewDetail")}</TooltipContent>
              </Tooltip>
              <RowEditButton label={td("edit")} href={`${href}/edit`} />
              {user.status === "pending" ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      aria-label={td("activate")}
                      disabled={activate.isPending}
                      onClick={() => activate.mutate(user.id)}
                    >
                      <UserCheck className="size-4" aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{td("activate")}</TooltipContent>
                </Tooltip>
              ) : user.status === "active" ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="destructive"
                      aria-label={td("suspend")}
                      onClick={() => setSuspendOpen(true)}
                    >
                      <Ban className="size-4" aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{td("suspend")}</TooltipContent>
                </Tooltip>
              ) : user.status === "suspended" ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      aria-label={td("restore")}
                      disabled={restore.isPending}
                      onClick={() => restore.mutate(user.id)}
                    >
                      <RotateCcw className="size-4" aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{td("restore")}</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <UserStatusBadge status={user.status} />
            {audience === "players" ? (
              <SoftStatusChip
                label={verified ? t("verified") : t("unverified")}
                tone={verified ? "emerald" : "muted"}
              />
            ) : null}
            {owner?.staff_role ? (
              <span className="text-xs text-muted-foreground">{staffRoleLabel(t, owner.staff_role)}</span>
            ) : null}
          </div>
          {owner?.primary_organization?.name ? (
            <p className="truncate text-xs text-muted-foreground">{owner.primary_organization.name}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {t("columns.lastLogin")}:{" "}
            {user.last_login_at ? formatUserDateTime(user.last_login_at, prefs) : "—"}
          </p>
        </CardContent>
      </Card>
      <UserSuspendDialog open={suspendOpen} onClose={() => setSuspendOpen(false)} userId={user.id} />
    </>
  );
}
