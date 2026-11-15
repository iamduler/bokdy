"use client";

import { Button, Field, FieldLabel } from "@bokdy/ui";
import { MapPin, PowerOff, ShieldCheck, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { DirectoryToolbar } from "@/components/data-list/directory-toolbar";
import { FilterSelect } from "@/components/data-list/filter-select";
import type { DataListStatItem, DataListStatusTab } from "@/components/data-list";
import type { PopoverCommandOption } from "@/components/popover-command-select";
import { useProvinces } from "@/hooks/use-admin-units";
import { useAdminOrganizations } from "@/hooks/use-admin-organizations";
import { useSports } from "@/hooks/use-sports";
import { useRouter } from "@/i18n/navigation";
import type { AdminBranchDirectoryStats, AdminBranchStatus } from "@/lib/api/admin-branches";

const STATUSES: AdminBranchStatus[] = ["active", "inactive", "maintenance", "archived"];

const STATUS_DOT: Record<AdminBranchStatus, string> = {
  active: "bg-emerald-500",
  inactive: "bg-amber-500",
  maintenance: "bg-amber-500",
  archived: "bg-violet-500",
};

export function BranchDirectoryToolbar({
  q,
  status,
  provinceId,
  organizationId,
  sportId,
  stats,
  statsLoading,
  children,
}: {
  q: string;
  status: AdminBranchStatus | "";
  provinceId: string;
  organizationId: string;
  sportId: string;
  stats: AdminBranchDirectoryStats | undefined;
  statsLoading?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("branchDirectory");
  const td = useTranslations("dataList");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(q);
  const { data: provinces = [] } = useProvinces("current_v2");
  const { data: organizations } = useAdminOrganizations({ limit: 100, sort: "name", order: "asc" });
  const { data: sports = [] } = useSports();
  const counts = {
    total: stats?.total ?? 0,
    active: stats?.active ?? 0,
    inactive: stats?.inactive ?? 0,
    maintenance: stats?.maintenance ?? 0,
    courtTotal: stats?.court_total ?? 0,
  };

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
      params.delete("offset");
      const qs = params.toString();
      router.replace(qs ? `/branches?${qs}` : "/branches");
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

  const provinceOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: "", label: t("filters.all"), keywords: t("filters.all") },
      ...provinces.map((province) => ({
        value: province.id,
        label: province.name,
        keywords: `${province.code} ${province.name} ${province.name_en} ${province.name_vi}`,
      })),
    ],
    [provinces, t],
  );
  const organizationOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: "", label: t("filters.all"), keywords: t("filters.all") },
      ...(organizations?.items ?? []).map((org) => ({
        value: org.id,
        label: org.name,
        keywords: `${org.code} ${org.name}`,
      })),
    ],
    [organizations, t],
  );
  const sportOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: "", label: t("filters.all"), keywords: t("filters.all") },
      ...sports.map((sport) => ({
        value: sport.id,
        label: sport.name,
        keywords: `${sport.code} ${sport.name} ${sport.name_en} ${sport.name_vi}`,
      })),
    ],
    [sports, t],
  );

  const kpi = useMemo<DataListStatItem[]>(
    () => [
      {
        key: "total",
        label: t("kpis.total"),
        value: counts.total,
        secondary: t("kpis.courtSecondary", { count: counts.courtTotal }),
        icon: <MapPin className="size-4" aria-hidden />,
        iconTone: "sky",
      },
      {
        key: "active",
        label: t("kpis.active"),
        value: counts.active,
        icon: <ShieldCheck className="size-4" aria-hidden />,
        iconTone: "emerald",
      },
      {
        key: "inactive",
        label: t("kpis.inactive"),
        value: counts.inactive,
        icon: <PowerOff className="size-4" aria-hidden />,
        iconTone: "amber",
      },
      {
        key: "maintenance",
        label: t("kpis.maintenance"),
        value: counts.maintenance,
        icon: <Wrench className="size-4" aria-hidden />,
        iconTone: "amber",
      },
    ],
    [counts, t],
  );

  const statusTabs = useMemo<DataListStatusTab[]>(
    () => [
      { value: "", label: t("allStatuses"), count: counts.total },
      ...STATUSES.map((item) => ({
        value: item,
        label: t(`status.${item}`),
        dotClass: STATUS_DOT[item],
        count:
          item === "active"
            ? counts.active
            : item === "inactive"
              ? counts.inactive
              : item === "maintenance"
                ? counts.maintenance
                : undefined,
      })),
    ],
    [counts, t],
  );

  const advancedCount =
    Number(Boolean(organizationId)) + Number(Boolean(sportId)) + Number(Boolean(provinceId));
  const hasAdvancedFilters = advancedCount > 0;
  function clearAdvanced() {
    replaceParams({
      organization_id: undefined,
      sport_id: undefined,
      province_id: undefined,
    });
  }

  return (
    <DirectoryToolbar
      title={t("title")}
      stats={kpi}
      statsLoading={statsLoading}
      statusTabs={statusTabs}
      statusValue={status}
      onStatusChange={(value) => replaceParams({ status: value || undefined })}
      statusAriaLabel={t("statusFilter")}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t("searchPlaceholder")}
      advancedLabel={td("advancedFilters")}
      advancedClassName="w-80"
      hasAdvancedFilters={hasAdvancedFilters}
      advancedFilterCount={advancedCount}
      onClearFilters={hasAdvancedFilters ? clearAdvanced : undefined}
      clearLabel={t("filters.clear")}
      advancedContent={
        <div className="space-y-3">
          <Field>
            <FieldLabel>{t("filters.organization")}</FieldLabel>
            <FilterSelect
              value={organizationId}
              onValueChange={(value) => replaceParams({ organization_id: value || undefined })}
              options={organizationOptions}
              ariaLabel={t("filters.organization")}
              placeholder={t("filters.all")}
              searchPlaceholder={t("filters.search")}
              emptyText={t("filters.empty")}
              searchable
              className="w-full"
            />
          </Field>
          <Field>
            <FieldLabel>{t("filters.sport")}</FieldLabel>
            <FilterSelect
              value={sportId}
              onValueChange={(value) => replaceParams({ sport_id: value || undefined })}
              options={sportOptions}
              ariaLabel={t("filters.sport")}
              placeholder={t("filters.all")}
              searchPlaceholder={t("filters.search")}
              emptyText={t("filters.empty")}
              searchable
              className="w-full"
            />
          </Field>
          <Field>
            <FieldLabel>{t("filters.province")}</FieldLabel>
            <FilterSelect
              value={provinceId}
              onValueChange={(value) => replaceParams({ province_id: value || undefined })}
              options={provinceOptions}
              ariaLabel={t("filters.province")}
              placeholder={t("filters.all")}
              searchPlaceholder={t("filters.search")}
              emptyText={t("filters.empty")}
              searchable
              className="w-full"
            />
          </Field>
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
          ) : null}
        </div>
      }
    >
      {children}
    </DirectoryToolbar>
  );
}
