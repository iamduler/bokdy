"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { OrganizationCreateDialog } from "@/components/organizations/organization-create-dialog";
import { OrganizationDirectoryFilters } from "@/components/organizations/organization-directory-filters";
import { OrganizationDirectoryHeader } from "@/components/organizations/organization-directory-header";
import { OrganizationDirectoryKpis } from "@/components/organizations/organization-directory-kpis";
import { deriveOrganizationDirectoryStats } from "@/components/organizations/organization-directory-stats";
import { OrganizationList } from "@/components/organizations/organization-list";
import { usePageShellTitle } from "@/components/shell/shell-title";
import { useAdminOrganizations } from "@/hooks/use-admin-organizations";
import type { OrgStatus } from "@/lib/api/admin";

const ORG_STATUSES = new Set<OrgStatus>(["active", "inactive", "suspended", "archived"]);

function parseStatus(raw: string | null): OrgStatus | "" {
  if (!raw) return "";
  return ORG_STATUSES.has(raw as OrgStatus) ? (raw as OrgStatus) : "";
}

function parseLimit(raw: string | null): number {
  const n = Number(raw ?? "50");
  if (!Number.isFinite(n) || n < 1) return 50;
  return Math.min(Math.floor(n), 100);
}

function OrganizationsPageContent() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.organizations"));
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  const q = searchParams.get("q") ?? "";
  const status = parseStatus(searchParams.get("status"));
  const provinceId = searchParams.get("province_id") ?? "";
  const limit = parseLimit(searchParams.get("limit"));
  const hasFilters = Boolean(q.trim() || status || provinceId);

  const params = {
    q: q.trim() || undefined,
    status: status || undefined,
    province_id: provinceId || undefined,
    limit,
  };

  const { data, isLoading, isError, refetch, isFetching } = useAdminOrganizations(params);
  const orgs = data ?? [];
  const stats = deriveOrganizationDirectoryStats(data);

  return (
    <div className="flex min-h-full flex-col overflow-hidden">
      <OrganizationDirectoryHeader
        stats={stats}
        isLoading={isLoading}
        onOpenCreate={() => setCreateOpen(true)}
      />
      <OrganizationDirectoryKpis stats={stats} isLoading={isLoading} />
      <OrganizationDirectoryFilters q={q} status={status} provinceId={provinceId} resultCount={orgs.length} />
      <OrganizationList
        orgs={orgs}
        hasFilters={hasFilters}
        isLoading={isLoading}
        isError={isError}
        isFetching={isFetching}
        onRetry={() => void refetch()}
      />
      <OrganizationCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

export default function OrganizationsPage() {
  const tc = useTranslations("common");

  return (
    <Suspense fallback={<p className="p-4 text-sm text-muted-foreground">{tc("loading")}</p>}>
      <OrganizationsPageContent />
    </Suspense>
  );
}
