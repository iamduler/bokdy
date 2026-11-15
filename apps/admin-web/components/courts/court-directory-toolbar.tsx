"use client";

import { Button, Field, FieldLabel } from "@bokdy/ui";
import { LandPlot, PowerOff, ShieldCheck, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { DirectoryToolbar } from "@/components/data-list/directory-toolbar";
import { FilterSelect } from "@/components/data-list/filter-select";
import type { DataListStatItem, DataListStatusTab } from "@/components/data-list";
import type { PopoverCommandOption } from "@/components/popover-command-select";
import { useAdminBranches } from "@/hooks/use-admin-branches";
import { useAdminOrganizations } from "@/hooks/use-admin-organizations";
import { useSports } from "@/hooks/use-sports";
import { useRouter } from "@/i18n/navigation";
import type {
  AdminCourtDirectoryStats,
  AdminCourtEnvironment,
  AdminCourtStatus,
  AdminCourtSurface,
} from "@/lib/api/admin-courts";

const STATUSES: AdminCourtStatus[] = ["active", "inactive", "maintenance", "archived"];
const ENVIRONMENTS: AdminCourtEnvironment[] = ["indoor", "outdoor", "unspecified"];
const SURFACES: AdminCourtSurface[] = [
  "unspecified",
  "pvc",
  "wood",
  "hard_court",
  "grass",
  "artificial_turf",
  "clay",
  "rubber",
  "other",
];

const STATUS_DOT: Record<AdminCourtStatus, string> = {
  active: "bg-emerald-500",
  inactive: "bg-amber-500",
  maintenance: "bg-amber-500",
  archived: "bg-violet-500",
};

export function CourtDirectoryToolbar({
  q,
  status,
  sportId,
  environment,
  organizationId,
  branchId,
  surface,
  stats,
  statsLoading,
  children,
}: {
  q: string;
  status: AdminCourtStatus | "";
  sportId: string;
  environment: AdminCourtEnvironment | "";
  organizationId: string;
  branchId: string;
  surface: AdminCourtSurface | "";
  stats: AdminCourtDirectoryStats | undefined;
  statsLoading?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("courtDirectory");
  const tSurface = useTranslations("organization.court.surface");
  const td = useTranslations("dataList");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(q);
  const { data: sports = [] } = useSports();
  const { data: organizations } = useAdminOrganizations({ limit: 100, sort: "name", order: "asc" });
  const { data: branches } = useAdminBranches({
    limit: 100,
    sort: "name",
    order: "asc",
    organization_id: organizationId || undefined,
  });
  const total = stats?.total ?? 0;
  const active = stats?.active ?? 0;
  const inactive = stats?.inactive ?? 0;
  const maintenance = stats?.maintenance ?? 0;

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
      router.replace(qs ? `/courts?${qs}` : "/courts");
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
  const environmentOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: "", label: t("filters.all"), keywords: t("filters.all") },
      ...ENVIRONMENTS.map((item) => ({
        value: item,
        label: t(`environment.${item}`),
        keywords: t(`environment.${item}`),
      })),
    ],
    [t],
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
  const branchOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: "", label: t("filters.all"), keywords: t("filters.all") },
      ...(branches?.items ?? []).map((branch) => ({
        value: branch.id,
        label: branch.name,
        keywords: `${branch.code} ${branch.name}`,
      })),
    ],
    [branches, t],
  );
  const surfaceOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: "", label: t("filters.all"), keywords: t("filters.all") },
      ...SURFACES.map((item) => ({
        value: item,
        label: tSurface(item),
        keywords: tSurface(item),
      })),
    ],
    [t, tSurface],
  );

  const kpi = useMemo<DataListStatItem[]>(
    () => [
      {
        key: "total",
        label: t("kpis.total"),
        value: total,
        icon: <LandPlot className="size-4" aria-hidden />,
        iconTone: "sky",
      },
      {
        key: "active",
        label: t("kpis.active"),
        value: active,
        icon: <ShieldCheck className="size-4" aria-hidden />,
        iconTone: "emerald",
      },
      {
        key: "inactive",
        label: t("kpis.inactive"),
        value: inactive,
        icon: <PowerOff className="size-4" aria-hidden />,
        iconTone: "amber",
      },
      {
        key: "maintenance",
        label: t("kpis.maintenance"),
        value: maintenance,
        icon: <Wrench className="size-4" aria-hidden />,
        iconTone: "amber",
      },
    ],
    [active, inactive, maintenance, t, total],
  );

  const statusTabs = useMemo<DataListStatusTab[]>(
    () => [
      { value: "", label: t("allStatuses"), count: total },
      ...STATUSES.map((item) => ({
        value: item,
        label: t(`status.${item}`),
        dotClass: STATUS_DOT[item],
        count:
          item === "active"
            ? active
            : item === "inactive"
              ? inactive
              : item === "maintenance"
                ? maintenance
                : undefined,
      })),
    ],
    [active, inactive, maintenance, t, total],
  );

  const advancedCount =
    Number(Boolean(organizationId)) +
    Number(Boolean(branchId)) +
    Number(Boolean(sportId)) +
    Number(Boolean(surface)) +
    Number(Boolean(environment));
  const hasAdvancedFilters = advancedCount > 0;

  function clearAdvanced() {
    replaceParams({
      organization_id: undefined,
      branch_id: undefined,
      sport_id: undefined,
      surface: undefined,
      environment: undefined,
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
              onValueChange={(value) =>
                replaceParams({ organization_id: value || undefined, branch_id: undefined })
              }
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
            <FieldLabel>{t("filters.branch")}</FieldLabel>
            <FilterSelect
              value={branchId}
              onValueChange={(value) => replaceParams({ branch_id: value || undefined })}
              options={branchOptions}
              ariaLabel={t("filters.branch")}
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
            <FieldLabel>{t("filters.surface")}</FieldLabel>
            <FilterSelect
              value={surface}
              onValueChange={(value) => replaceParams({ surface: value || undefined })}
              options={surfaceOptions}
              ariaLabel={t("filters.surface")}
              placeholder={t("filters.all")}
              searchPlaceholder={t("filters.search")}
              emptyText={t("filters.empty")}
              searchable
              className="w-full"
            />
          </Field>
          <Field>
            <FieldLabel>{t("filters.environment")}</FieldLabel>
            <FilterSelect
              value={environment}
              onValueChange={(value) => replaceParams({ environment: value || undefined })}
              options={environmentOptions}
              ariaLabel={t("filters.environment")}
              placeholder={t("filters.all")}
              className="w-full"
            />
          </Field>
          {hasAdvancedFilters ? (
            <Button type="button" variant="ghost" size="sm" className="w-full rounded-full" onClick={clearAdvanced}>
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
