"use client";

import { Button, Label } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  DataListLayout,
  type DataListStatItem,
} from "@/components/data-list";
import { EntityUnavailable } from "@/components/entity/unavailable";
import {
  PopoverCommandSelect,
  type PopoverCommandOption,
} from "@/components/popover-command-select";
import { useProvinces } from "@/hooks/use-admin-units";
import { useRouter } from "@/i18n/navigation";
import type { OrgStatus } from "@/lib/api/admin";

const ORG_STATUSES: OrgStatus[] = ["active", "inactive", "suspended", "archived"];

type OrganizationDirectoryToolbarProps = {
  q: string;
  status: OrgStatus | "";
  provinceId: string;
  stats: DataListStatItem[];
  statsLoading?: boolean;
  onOpenCreate: () => void;
  children: ReactNode;
};

export function OrganizationDirectoryToolbar({
  q,
  status,
  provinceId,
  stats,
  statsLoading,
  onOpenCreate,
  children,
}: OrganizationDirectoryToolbarProps) {
  const t = useTranslations("organization");
  const td = useTranslations("dataList");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(q);
  const { data: provinces = [] } = useProvinces("current_v2");

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

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("allStatuses") },
      ...ORG_STATUSES.map((item) => ({
        value: item,
        label: t(`status.${item}`),
      })),
    ],
    [t],
  );

  const provinceOptions = useMemo<PopoverCommandOption[]>(
    () => [
      {
        value: "",
        label: t("directoryFilters.province"),
        keywords: t("directoryFilters.province"),
      },
      ...provinces.map((province) => ({
        value: province.id,
        label: province.name,
        keywords: `${province.code} ${province.name} ${province.name_en} ${province.name_vi}`,
      })),
    ],
    [provinces, t],
  );

  const planOptions = useMemo<PopoverCommandOption[]>(
    () => [
      {
        value: "",
        label: t("directoryFilters.plan"),
        keywords: t("directoryFilters.plan"),
      },
    ],
    [t],
  );

  const hasAdvancedFilters = Boolean(provinceId);

  function clearAdvanced() {
    replaceParams({ province_id: undefined });
  }

  function clearAll() {
    setSearch("");
    replaceParams({
      q: undefined,
      status: undefined,
      province_id: undefined,
    });
  }

  return (
    <DataListLayout
      stats={stats}
      statsLoading={statsLoading}
      advancedFilterCount={provinceId ? 1 : 0}
      primaryAction={
        <Button type="button" variant="default" size="sm" onClick={onOpenCreate}>
          + {t("create")}
        </Button>
      }
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t("directoryFilters.searchPlaceholder")}
      quickFilter={{
        ariaLabel: t("statusFilter"),
        value: status,
        placeholder: t("directoryFilters.statusPlaceholder"),
        options: statusOptions,
        onChange: (value) => replaceParams({ status: value || undefined }),
      }}
      advancedLabel={td("advancedFilters")}
      hasAdvancedFilters={hasAdvancedFilters}
      onClearFilters={hasAdvancedFilters ? clearAdvanced : undefined}
      clearLabel={t("directoryFilters.clear")}
      advancedContent={
        <div className="space-y-3">
          <p className="text-xs font-medium text-foreground">
            {td("advancedFilters")}
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("directoryFilters.province")}
            </Label>
            <PopoverCommandSelect
              value={provinceId}
              onValueChange={(value) =>
                replaceParams({ province_id: value || undefined })
              }
              options={provinceOptions}
              placeholder={t("directoryFilters.province")}
              searchPlaceholder={t("directoryFilters.filterSearch")}
              emptyText={t("directoryFilters.filterEmpty")}
              searchable
              align="start"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("directoryFilters.plan")}
            </Label>
            <EntityUnavailable reason={t("directoryFilters.planUnavailable")} className="w-full">
              <PopoverCommandSelect
                value=""
                onValueChange={() => undefined}
                options={planOptions}
                placeholder={t("directoryFilters.plan")}
                searchPlaceholder={t("directoryFilters.filterSearch")}
                emptyText={t("directoryFilters.filterEmpty")}
                disabled
                align="start"
              />
            </EntityUnavailable>
          </div>
          {(hasAdvancedFilters || status || q.trim()) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={clearAll}
            >
              {t("directoryFilters.clear")}
            </Button>
          )}
        </div>
      }
    >
      {children}
    </DataListLayout>
  );
}
