"use client";

import { Input, Label } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";

import { useRouter } from "@/i18n/navigation";
import type { OrgStatus } from "@/lib/api/admin";

const ORG_STATUSES: OrgStatus[] = ["active", "inactive", "suspended", "archived"];

type OrganizationFiltersProps = {
  q: string;
  status: OrgStatus | "";
};

export function OrganizationFilters({ q, status }: OrganizationFiltersProps) {
  const t = useTranslations("organization");
  const router = useRouter();
  const searchParams = useSearchParams();
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
      router.replace(qs ? `/organizations?${qs}` : "/organizations");
    },
    [router, searchParams],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = search.trim();
      if (trimmed === q.trim()) return;
      replaceParams({ q: trimmed || undefined });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, q, replaceParams]);

  function onStatusChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as OrgStatus | "";
    replaceParams({ status: value || undefined });
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="org-search">{t("searchPlaceholder")}</Label>
        <Input
          id="org-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          autoComplete="off"
        />
      </div>
      <div className="w-full space-y-1.5 sm:w-48">
        <Label htmlFor="org-status">{t("statusFilter")}</Label>
        <select
          id="org-status"
          value={status}
          onChange={onStatusChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">{t("allStatuses")}</option>
          {ORG_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
