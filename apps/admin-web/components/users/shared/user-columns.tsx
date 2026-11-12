"use client";

import { Button, formatUserDateTime, Tooltip, TooltipContent, TooltipTrigger, useUserDateTimePrefs } from "@bokdy/ui";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { UserStatusBadge } from "@/components/users/shared/user-status-badge";
import { UserUnavailableBadge } from "@/components/users/shared/user-unavailable-badge";
import { Link } from "@/i18n/navigation";
import { staffRoleLabel } from "@/lib/users/staff-role-label";
import type {
  AdminOwnerUser,
  AdminPlayerUser,
  AdminSystemUser,
  UserAudience,
} from "@/lib/api/admin-users";

export type UserRow = AdminPlayerUser | AdminOwnerUser | AdminSystemUser;

function displayName(user: UserRow) {
  return user.display_name || user.full_name || user.email || user.public_id;
}

export function useUserColumns(audience: UserAudience) {
  const t = useTranslations("users");
  const prefs = useUserDateTimePrefs();
  const base = `/users/${audience}`;

  return useMemo<ColumnDef<UserRow, unknown>[]>(() => {
    const cols: ColumnDef<UserRow, unknown>[] = [
      {
        id: "user",
        accessorFn: (row) => displayName(row),
        header: t("columns.user"),
        size: 220,
        minSize: 160,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="min-w-0">
              <Link
                href={`${base}/${user.id}`}
                className="block truncate font-semibold text-foreground"
              >
                {displayName(user)}
              </Link>
              <p className="truncate text-xs tracking-wide text-muted-foreground">
                {user.email}
              </p>
            </div>
          );
        },
      },
    ];

    if (audience === "owners") {
      cols.push(
        {
          id: "staff_role",
          accessorFn: (row) => (row as AdminOwnerUser).staff_role ?? "",
          header: t("columns.staffRole"),
          enableSorting: false,
          size: 120,
          cell: ({ row }) => (
            <span className="text-sm">
              {staffRoleLabel(t, (row.original as AdminOwnerUser).staff_role)}
            </span>
          ),
        },
        {
          id: "organization",
          accessorFn: (row) =>
            (row as AdminOwnerUser).primary_organization?.name ?? "",
          header: t("columns.organization"),
          enableSorting: false,
          size: 160,
          cell: ({ row }) => (
            <span className="text-sm">
              {(row.original as AdminOwnerUser).primary_organization?.name ??
                "—"}
            </span>
          ),
        },
      );
    }

    cols.push({
      id: "status",
      accessorKey: "status",
      header: t("columns.status"),
      size: 130,
      cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
    });

    if (audience === "players") {
      cols.push({
        id: "email_verified",
        accessorFn: (row) => row.email_verified_at ?? "",
        header: t("columns.emailVerified"),
        enableSorting: false,
        size: 120,
        cell: ({ row }) => {
          const verified = Boolean(row.original.email_verified_at);
          return (
            <SoftStatusChip
              label={verified ? t("verified") : t("unverified")}
              tone={verified ? "emerald" : "muted"}
            />
          );
        },
      });
    }

    cols.push(
      {
        id: "last_login",
        accessorKey: "last_login_at",
        header: t("columns.lastLogin"),
        size: 160,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.last_login_at ? formatUserDateTime(row.original.last_login_at, prefs) : "—"}
          </span>
        ),
      },
    );

    if (audience !== "players") {
      cols.push({
        id: "mfa",
        header: t("columns.mfa"),
        enableSorting: false,
        size: 90,
        cell: () => <UserUnavailableBadge />,
      });
    }

    cols.push({
      id: "actions",
      header: t("columns.actions"),
      enableSorting: false,
      enableResizing: false,
      size: 64,
      minSize: 64,
      maxSize: 64,
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="outline" size="icon-sm" className="rounded-full" aria-label={t("viewDetail")}>
              <Link
                href={`${base}/${row.original.id}`}
                onClick={(event) => event.stopPropagation()}
              >
                <Eye className="size-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("viewDetail")}</TooltipContent>
        </Tooltip>
      ),
    });

    return cols;
  }, [audience, base, prefs, t]);
}

export { displayName };
