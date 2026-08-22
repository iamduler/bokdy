"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { OrganizationFilters } from "@/components/organizations/organization-filters";
import { OrganizationList } from "@/components/organizations/organization-list";
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
  const t = useTranslations("organization");
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const status = parseStatus(searchParams.get("status"));
  const limit = parseLimit(searchParams.get("limit"));
  const hasFilters = Boolean(q.trim() || status);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <OrganizationFilters q={q} status={status} />
      <OrganizationList q={q.trim() || undefined} status={status || undefined} limit={limit} hasFilters={hasFilters} />
    </main>
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
