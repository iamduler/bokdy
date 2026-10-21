"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@bokdy/ui";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { UserStatusBadge } from "@/components/users/shared/user-status-badge";
import { UserUnavailableBadge } from "@/components/users/shared/user-unavailable-badge";
import { Link } from "@/i18n/navigation";
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

function formatLastLogin(at?: string | null) {
  if (!at) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(at));
  } catch {
    return at;
  }
}

export function useUserColumns(audience: UserAudience) {
  const t = useTranslations("users");
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
                className="block truncate font-semibold text-foreground underline-offset-4 hover:underline"
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
          size: 120,
          cell: ({ row }) => (
            <span className="text-sm">
              {(row.original as AdminOwnerUser).staff_role ?? "—"}
            </span>
          ),
        },
        {
          id: "organization",
          accessorFn: (row) =>
            (row as AdminOwnerUser).primary_organization?.name ?? "",
          header: t("columns.organization"),
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
        size: 120,
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.email_verified_at ? t("verified") : t("unverified")}
          </span>
        ),
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
            {formatLastLogin(row.original.last_login_at)}
          </span>
        ),
      },
      {
        id: "mfa",
        header: t("columns.mfa"),
        enableSorting: false,
        size: 90,
        cell: () => <UserUnavailableBadge />,
      },
    );

    if (audience === "players") {
      cols.push({
        id: "risk",
        header: t("columns.risk"),
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
            <Link
              href={`${base}/${row.original.id}`}
              className="inline-flex size-8 items-center justify-center rounded-full border border-input bg-background hover:bg-primary hover:text-primary-foreground"
              aria-label={t("viewDetail")}
              onClick={(event) => event.stopPropagation()}
            >
              <Eye className="size-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>{t("viewDetail")}</TooltipContent>
        </Tooltip>
      ),
    });

    return cols;
  }, [audience, base, t]);
}

export { displayName };
