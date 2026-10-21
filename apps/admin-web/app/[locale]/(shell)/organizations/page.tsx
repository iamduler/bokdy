"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { deriveOrganizationDirectoryStats } from "@/components/organizations/organization-directory-stats";
import { OrganizationDirectoryToolbar } from "@/components/organizations/organization-directory-toolbar";
import { OrganizationList } from "@/components/organizations/organization-list";
import { usePageShellTitle } from "@/components/shell/shell-title";
import { useAdminOrganizations } from "@/hooks/use-admin-organizations";
import { useRouter } from "@/i18n/navigation";
import type { OrgStatus } from "@/lib/api/admin";

const ORG_STATUSES = new Set<OrgStatus>([
  "active",
  "inactive",
  "suspended",
  "archived",
]);

function parseStatus(raw: string | null): OrgStatus | "" {
  if (!raw) return "";
  return ORG_STATUSES.has(raw as OrgStatus) ? (raw as OrgStatus) : "";
}

function OrganizationsPageContent() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.organizations"));
  const router = useRouter();
  const searchParams = useSearchParams();
  const openCreate = () => router.push("/organizations/new");

  const q = searchParams.get("q") ?? "";
  const status = parseStatus(searchParams.get("status"));
  const provinceId = searchParams.get("province_id") ?? "";
  const hasFilters = Boolean(q.trim() || status || provinceId);

  const params = {
    q: q.trim() || undefined,
    status: status || undefined,
    province_id: provinceId || undefined,
    limit: 100,
  };

  const { data, isLoading, isError, refetch, isFetching } =
    useAdminOrganizations(params);
  const orgs = data ?? [];
  const directoryStats = deriveOrganizationDirectoryStats(data);

  return (
    <div className="flex min-h-full flex-col overflow-hidden">
      <OrganizationDirectoryToolbar
        q={q}
        status={status}
        provinceId={provinceId}
        directoryStats={directoryStats}
        statsLoading={isLoading}
        onOpenCreate={openCreate}
      >
        <OrganizationList
          key={`${q}|${status}|${provinceId}`}
          orgs={orgs}
          hasFilters={hasFilters}
          isLoading={isLoading}
          isError={isError}
          isFetching={isFetching}
          onRetry={() => void refetch()}
          onOpenCreate={openCreate}
        />
      </OrganizationDirectoryToolbar>
    </div>
  );
}

export default function OrganizationsPage() {
  const tc = useTranslations("common");

  return (
    <Suspense
      fallback={
        <p className="p-4 text-sm text-muted-foreground">{tc("loading")}</p>
      }
    >
      <OrganizationsPageContent />
    </Suspense>
  );
}
