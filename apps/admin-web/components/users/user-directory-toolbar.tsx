"use client";

import { Button, Label } from "@bokdy/ui";
import {
  PauseCircle,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, type ReactNode } from "react";

import {
  DataListLayout,
  type DataListStatItem,
  type DataListStatusTab,
} from "@/components/data-list";
import {
  PopoverCommandSelect,
  type PopoverCommandOption,
} from "@/components/popover-command-select";
import type { UserAudience, UserStatus } from "@/lib/api/admin-users";

const STATUS_OPTIONS: UserStatus[] = ["active", "suspended", "pending", "locked"];

const STATUS_DOT: Record<UserStatus, string> = {
  active: "bg-emerald-500",
  suspended: "bg-rose-500",
  pending: "bg-amber-500",
  locked: "bg-violet-500",
  deleted: "bg-muted-foreground",
};

type UserDirectoryStats = {
  total?: number;
  active?: number;
  new_this_week?: number;
  suspended?: number;
};

type UserDirectoryToolbarProps = {
  audience: UserAudience;
  status: UserStatus | "";
  emailVerifiedRaw: string;
  staffRole: "" | "org_owner" | "org_staff";
  search: string;
  onSearchChange: (value: string) => void;
  onReplaceParams: (updates: Record<string, string | undefined>) => void;
  stats?: UserDirectoryStats;
  statsLoading?: boolean;
  children: ReactNode;
};

/**
 * Soft UI directory chrome for user audiences — same DataListLayout slots as org toolbar.
 */
export function UserDirectoryToolbar({
  audience,
  status,
  emailVerifiedRaw,
  staffRole,
  search,
  onSearchChange,
  onReplaceParams,
  stats,
  statsLoading,
  children,
}: UserDirectoryToolbarProps) {
  const t = useTranslations("users");
  const td = useTranslations("dataList");

  const kpiItems = useMemo<DataListStatItem[]>(
    () => [
      {
        key: "total",
        label: t("kpis.total"),
        value: stats?.total ?? 0,
        icon: <Users className="size-4" aria-hidden />,
        iconTone: "sky",
      },
      {
        key: "active",
        label: t("kpis.active"),
        value: stats?.active ?? 0,
        icon: <ShieldCheck className="size-4" aria-hidden />,
        iconTone: "emerald",
      },
      {
        key: "newThisWeek",
        label: t("kpis.newThisWeek"),
        value: stats?.new_this_week ?? 0,
        icon: <UserPlus className="size-4" aria-hidden />,
        iconTone: "amber",
      },
      {
        key: "suspended",
        label: t("kpis.suspended"),
        value: stats?.suspended ?? 0,
        icon: <PauseCircle className="size-4" aria-hidden />,
        iconTone: "rose",
      },
    ],
    [stats, t],
  );

  const statusTabs = useMemo<DataListStatusTab[]>(
    () => [
      {
        value: "",
        label: t("filters.all"),
        count: stats?.total,
      },
      ...STATUS_OPTIONS.map((item) => ({
        value: item,
        label: t(`filters.statusOption.${item}`),
        dotClass: STATUS_DOT[item],
        count:
          item === "active"
            ? stats?.active
            : item === "suspended"
              ? stats?.suspended
              : undefined,
      })),
    ],
    [stats, t],
  );

  const emailOptions = useMemo<PopoverCommandOption[]>(
    () => [
      {
        value: "",
        label: t("filters.emailVerified"),
        keywords: t("filters.emailVerified"),
      },
      {
        value: "true",
        label: t("filters.verified"),
        keywords: t("filters.verified"),
      },
      {
        value: "false",
        label: t("filters.unverified"),
        keywords: t("filters.unverified"),
      },
    ],
    [t],
  );

  const roleOptions = useMemo<PopoverCommandOption[]>(
    () => [
      {
        value: "",
        label: t("filters.staffRole"),
        keywords: t("filters.staffRole"),
      },
      {
        value: "org_owner",
        label: t("filters.roleOwner"),
        keywords: t("filters.roleOwner"),
      },
      {
        value: "org_staff",
        label: t("filters.roleStaff"),
        keywords: t("filters.roleStaff"),
      },
    ],
    [t],
  );

  const hasAdvancedFilters = Boolean(emailVerifiedRaw || staffRole);

  function clearAdvanced() {
    onReplaceParams({ email_verified: undefined, staff_role: undefined });
  }

  return (
    <DataListLayout
      title={t(`audience.${audience}`)}
      eyebrow={t(`audienceHint.${audience}`)}
      stats={kpiItems}
      statsLoading={statsLoading}
      statusTabs={statusTabs}
      statusValue={status}
      onStatusChange={(value) =>
        onReplaceParams({ status: value || undefined })
      }
      statusAriaLabel={t("filters.status")}
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={t("filters.searchPlaceholder")}
      advancedLabel={td("advancedFilters")}
      hasAdvancedFilters={hasAdvancedFilters}
      advancedFilterCount={(emailVerifiedRaw ? 1 : 0) + (staffRole ? 1 : 0)}
      onClearFilters={hasAdvancedFilters ? clearAdvanced : undefined}
      clearLabel={t("filters.clear")}
      advancedContent={
        <div className="space-y-3">
          <p className="text-xs font-medium text-foreground">
            {td("advancedFilters")}
          </p>
          {audience === "players" ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("filters.emailVerified")}
              </Label>
              <PopoverCommandSelect
                value={emailVerifiedRaw}
                onValueChange={(value) =>
                  onReplaceParams({ email_verified: value || undefined })
                }
                options={emailOptions}
                placeholder={t("filters.emailVerified")}
                searchPlaceholder={t("filters.filterSearch")}
                emptyText={t("filters.filterEmpty")}
                align="start"
              />
            </div>
          ) : null}
          {audience === "owners" ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("filters.staffRole")}
              </Label>
              <PopoverCommandSelect
                value={staffRole}
                onValueChange={(value) =>
                  onReplaceParams({ staff_role: value || undefined })
                }
                options={roleOptions}
                placeholder={t("filters.staffRole")}
                searchPlaceholder={t("filters.filterSearch")}
                emptyText={t("filters.filterEmpty")}
                align="start"
              />
            </div>
          ) : null}
          {hasAdvancedFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full rounded-full"
              onClick={clearAdvanced}
            >
              {t("filters.clear")}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t("filters.noAdvanced")}
            </p>
          )}
        </div>
      }
    >
      {children}
    </DataListLayout>
  );
}
