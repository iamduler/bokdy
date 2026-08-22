"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { UserDirectoryFilters } from "@/components/users/shared/user-directory-filters";
import { UserDirectoryKpis } from "@/components/users/shared/user-directory-kpis";
import { UserList } from "@/components/users/shared/user-list";
import { usePageShellTitle } from "@/components/shell/shell-title";
import { useAdminUserList, useAdminUserStats } from "@/hooks/use-admin-users";
import type { UserAudience, UserStatus } from "@/lib/api/admin-users";

const USER_STATUSES = new Set<UserStatus>(["active", "suspended", "pending", "locked"]);

function parseStatus(raw: string | null): UserStatus | "" {
  if (!raw) return "";
  return USER_STATUSES.has(raw as UserStatus) ? (raw as UserStatus) : "";
}

const PAGE_TITLE_KEY: Record<UserAudience, "usersPlayers" | "usersOwners" | "usersAdmins"> = {
  players: "usersPlayers",
  owners: "usersOwners",
  admins: "usersAdmins",
};

function UserDirectoryPageContent({ audience }: { audience: UserAudience }) {
  const t = useTranslations("users");
  const ts = useTranslations("shell");
  usePageShellTitle(ts(`pageTitles.${PAGE_TITLE_KEY[audience]}`));
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const status = parseStatus(searchParams.get("status"));
  const emailVerifiedRaw = searchParams.get("email_verified") ?? "";
  const staffRole = (searchParams.get("staff_role") ?? "") as "" | "org_owner" | "org_staff";

  const listParams = {
    q: q.trim() || undefined,
    status: status || undefined,
    email_verified:
      emailVerifiedRaw === "true" ? true : emailVerifiedRaw === "false" ? false : undefined,
    staff_role: staffRole || undefined,
    limit: 50,
  };

  const hasFilters = Boolean(
    q.trim() || status || emailVerifiedRaw || staffRole,
  );

  const { data, isLoading, isError, refetch, isFetching } = useAdminUserList(audience, listParams);
  const statsQuery = useAdminUserStats(audience);
  const users = data ?? [];

  return (
    <div className="flex min-h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-4 py-4 md:px-6">
        <h1 className="font-display text-xl font-bold">{t(`audience.${audience}`)}</h1>
        <p className="text-sm text-muted-foreground">{t(`audienceHint.${audience}`)}</p>
      </div>
      <UserDirectoryKpis stats={statsQuery.data} isLoading={statsQuery.isLoading} />
      <UserDirectoryFilters
        audience={audience}
        q={q}
        status={status}
        emailVerified={emailVerifiedRaw as "" | "true" | "false"}
        staffRole={staffRole}
        resultCount={users.length}
      />
      <UserList
        audience={audience}
        users={users}
        hasFilters={hasFilters}
        isLoading={isLoading}
        isError={isError}
        isFetching={isFetching}
        onRetry={() => void refetch()}
      />
    </div>
  );
}

export function UserDirectoryPage({ audience }: { audience: UserAudience }) {
  const tc = useTranslations("common");
  return (
    <Suspense fallback={<p className="p-4 text-sm text-muted-foreground">{tc("loading")}</p>}>
      <UserDirectoryPageContent audience={audience} />
    </Suspense>
  );
}
