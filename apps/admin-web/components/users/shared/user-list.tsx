"use client";

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bokdy/ui";
import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";

import { UserStatusBadge } from "@/components/users/shared/user-status-badge";
import { UserUnavailableBadge } from "@/components/users/shared/user-unavailable-badge";
import { Link, useRouter } from "@/i18n/navigation";
import type {
  AdminOwnerUser,
  AdminPlayerUser,
  AdminSystemUser,
  UserAudience,
} from "@/lib/api/admin-users";

type UserRow = AdminPlayerUser | AdminOwnerUser | AdminSystemUser;

type UserListProps = {
  audience: UserAudience;
  users: UserRow[];
  hasFilters: boolean;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
};

function displayName(user: UserRow) {
  return user.display_name || user.full_name || user.email || user.public_id;
}

function formatLastLogin(at?: string | null) {
  if (!at) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(at),
    );
  } catch {
    return at;
  }
}

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
  const router = useRouter();
  const base = `/users/${audience}`;

  if (isLoading) {
    return <p className="px-4 py-6 text-sm text-muted-foreground md:px-6">{tc("loading")}</p>;
  }

  if (isError) {
    return (
      <div className="mx-4 my-4 space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 md:mx-6">
        <p className="text-sm text-destructive">{t("loadError")}</p>
        <Button variant="outline" size="sm" onClick={onRetry} disabled={isFetching}>
          {tc("retry")}
        </Button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground md:px-6">
        {hasFilters ? t("emptyFilter") : t("emptyNone")}
      </p>
    );
  }

  return (
    <div className="flex-1 overflow-auto soft-scrollbar px-4 pb-6 md:px-6">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead>{t("columns.user")}</TableHead>
            {audience === "owners" ? (
              <>
                <TableHead>{t("columns.staffRole")}</TableHead>
                <TableHead>{t("columns.organization")}</TableHead>
              </>
            ) : null}
            <TableHead>{t("columns.status")}</TableHead>
            {audience === "players" ? <TableHead>{t("columns.emailVerified")}</TableHead> : null}
            <TableHead>{t("columns.lastLogin")}</TableHead>
            <TableHead>{t("columns.mfa")}</TableHead>
            {audience === "players" ? <TableHead>{t("columns.risk")}</TableHead> : null}
            <TableHead className="w-16">{t("columns.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const owner = audience === "owners" ? (user as AdminOwnerUser) : null;
            return (
              <TableRow
                key={user.id}
                className="cursor-pointer"
                onClick={() => router.push(`${base}/${user.id}`)}
              >
                <TableCell>
                  <div>
                    <p className="font-semibold">{displayName(user)}</p>
                    <p className="font-mono text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </TableCell>
                {audience === "owners" && owner ? (
                  <>
                    <TableCell className="text-sm">{owner.staff_role ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      {owner.primary_organization?.name ?? "—"}
                    </TableCell>
                  </>
                ) : null}
                <TableCell>
                  <UserStatusBadge status={user.status} />
                </TableCell>
                {audience === "players" ? (
                  <TableCell className="text-sm">
                    {user.email_verified_at ? t("verified") : t("unverified")}
                  </TableCell>
                ) : null}
                <TableCell className="text-sm text-muted-foreground">
                  {formatLastLogin(user.last_login_at)}
                </TableCell>
                <TableCell>
                  <UserUnavailableBadge />
                </TableCell>
                {audience === "players" ? (
                  <TableCell>
                    <UserUnavailableBadge />
                  </TableCell>
                ) : null}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`${base}/${user.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input hover:bg-accent"
                        aria-label={t("viewDetail")}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>{t("viewDetail")}</TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
