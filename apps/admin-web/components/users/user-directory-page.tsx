"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { usePageShellTitle } from "@/components/shell/shell-title";
import { UserDirectoryToolbar } from "@/components/users/user-directory-toolbar";
import { UserList } from "@/components/users/shared/user-list";
import { useAdminUserList, useAdminUserStats } from "@/hooks/use-admin-users";
import { useRouter } from "@/i18n/navigation";
import type { UserAudience, UserStatus } from "@/lib/api/admin-users";

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
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const qs = params.toString();
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
    limit: 50,
  };

  const hasFilters = Boolean(q.trim() || status || emailVerifiedRaw || staffRole);

  const { data, isLoading, isError, refetch, isFetching } = useAdminUserList(
    audience,
    listParams,
  );
  const statsQuery = useAdminUserStats(audience);
  const users = data ?? [];

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
      >
        <UserList
          audience={audience}
          users={users}
          hasFilters={hasFilters}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          onRetry={() => void refetch()}
        />
      </UserDirectoryToolbar>
    </div>
  );
}

export function UserDirectoryPage({ audience }: { audience: UserAudience }) {
  const tc = useTranslations("common");
  return (
    <Suspense
      fallback={<p className="p-4 text-sm text-muted-foreground">{tc("loading")}</p>}
    >
      <UserDirectoryPageContent audience={audience} />
    </Suspense>
  );
}
