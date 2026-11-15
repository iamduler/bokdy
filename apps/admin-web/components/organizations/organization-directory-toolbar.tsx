"use client";

import { Button, Field, FieldLabel } from "@bokdy/ui";
import {
  Building2,
  PauseCircle,
  PowerOff,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  type DataListStatItem,
  type DataListStatusTab,
} from "@/components/data-list";
import { DirectoryToolbar } from "@/components/data-list/directory-toolbar";
import { FilterSelect } from "@/components/data-list/filter-select";
import type { OrganizationDirectoryStats } from "@/components/organizations/organization-directory-stats";
import { type PopoverCommandOption } from "@/components/popover-command-select";
import { useProvinces } from "@/hooks/use-admin-units";
import { useRouter } from "@/i18n/navigation";
import type { OrganizationType, OrgStatus } from "@/lib/api/admin";

const ORG_TYPES: OrganizationType[] = [
  "company",
  "club",
  "school",
  "government",
  "individual",
  "other",
];

const ORG_STATUSES: OrgStatus[] = [
  "active",
  "inactive",
  "suspended",
  "archived",
];

const STATUS_DOT: Record<OrgStatus, string> = {
  active: "bg-emerald-500",
  inactive: "bg-amber-500",
  suspended: "bg-rose-500",
  archived: "bg-violet-500",
};

type OrganizationDirectoryToolbarProps = {
  q: string;
  status: OrgStatus | "";
  provinceId: string;
  organizationType: OrganizationType | "";
  directoryStats: OrganizationDirectoryStats;
  statsLoading?: boolean;
  onOpenCreate: () => void;
  children: ReactNode;
};

export function OrganizationDirectoryToolbar({
  q,
  status,
  provinceId,
  organizationType,
  directoryStats,
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
      params.delete("offset");
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

  const provinceOptions = useMemo<PopoverCommandOption[]>(
    () => [
      {
        value: "",
        label: t("directoryFilters.allProvinces"),
        keywords: t("directoryFilters.allProvinces"),
      },
      ...provinces.map((province) => ({
        value: province.id,
        label: province.name,
        keywords: `${province.code} ${province.name} ${province.name_en} ${province.name_vi}`,
      })),
    ],
    [provinces, t],
  );

  const stats = useMemo<DataListStatItem[]>(
    () => [
      {
        key: "total",
        label: t("directoryKpis.total"),
        value: directoryStats.total,
        secondary: t("directoryKpis.branchSecondary", {
          count: directoryStats.branchTotal,
        }),
        icon: <Building2 className="size-4" aria-hidden />,
        iconTone: "sky",
      },
      {
        key: "active",
        label: t("directoryKpis.active"),
        value: directoryStats.active,
        icon: <ShieldCheck className="size-4" aria-hidden />,
        iconTone: "emerald",
      },
      {
        key: "inactive",
        label: t("directoryKpis.inactive"),
        value: directoryStats.inactive,
        icon: <PowerOff className="size-4" aria-hidden />,
        iconTone: "amber",
      },
      {
        key: "suspended",
        label: t("directoryKpis.suspended"),
        value: directoryStats.suspended,
        icon: <PauseCircle className="size-4" aria-hidden />,
        iconTone: "rose",
      },
    ],
    [directoryStats, t],
  );

  const statusTabs = useMemo<DataListStatusTab[]>(
    () => [
      {
        value: "",
        label: t("allStatuses"),
        count: directoryStats.total,
      },
      ...ORG_STATUSES.map((item) => ({
        value: item,
        label: t(`status.${item}`),
        dotClass: STATUS_DOT[item],
        count:
          item === "active"
            ? directoryStats.active
            : item === "inactive"
              ? directoryStats.inactive
              : item === "suspended"
                ? directoryStats.suspended
                : undefined,
      })),
    ],
    [directoryStats, t],
  );

  const typeOptions = useMemo<PopoverCommandOption[]>(
    () => [
      {
        value: "",
        label: t("directoryFilters.allProvinces"),
        keywords: t("directoryFilters.allProvinces"),
      },
      ...ORG_TYPES.map((item) => ({
        value: item,
        label: t(`type.${item}`),
        keywords: t(`type.${item}`),
      })),
    ],
    [t],
  );

  const advancedCount = Number(Boolean(provinceId)) + Number(Boolean(organizationType));
  const hasAdvancedFilters = advancedCount > 0;

  function clearAdvanced() {
    replaceParams({ province_id: undefined, organization_type: undefined });
  }

  return (
    <DirectoryToolbar
      title={t("title")}
      stats={stats}
      statsLoading={statsLoading}
      createLabel={t("create")}
      onCreate={onOpenCreate}
      statusTabs={statusTabs}
      statusValue={status}
      onStatusChange={(value) => replaceParams({ status: value || undefined })}
      statusAriaLabel={t("statusFilter")}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t("directoryFilters.searchPlaceholder")}
      advancedLabel={td("advancedFilters")}
      advancedClassName="w-80"
      hasAdvancedFilters={hasAdvancedFilters}
      advancedFilterCount={advancedCount}
      onClearFilters={hasAdvancedFilters ? clearAdvanced : undefined}
      clearLabel={t("directoryFilters.clear")}
      advancedContent={
        <div className="space-y-3">
          <Field>
            <FieldLabel>{t("directoryFilters.type")}</FieldLabel>
            <FilterSelect
              value={organizationType}
              onValueChange={(value) =>
                replaceParams({ organization_type: value || undefined })
              }
              options={typeOptions}
              ariaLabel={t("directoryFilters.type")}
              placeholder={t("directoryFilters.allProvinces")}
              searchPlaceholder={t("directoryFilters.filterSearch")}
              emptyText={t("directoryFilters.filterEmpty")}
              searchable
              className="w-full"
            />
          </Field>
          <Field>
            <FieldLabel>{t("directoryFilters.province")}</FieldLabel>
            <FilterSelect
              value={provinceId}
              onValueChange={(value) =>
                replaceParams({ province_id: value || undefined })
              }
              options={provinceOptions}
              ariaLabel={t("directoryFilters.province")}
              placeholder={t("directoryFilters.allProvinces")}
              searchPlaceholder={t("directoryFilters.filterSearch")}
              emptyText={t("directoryFilters.filterEmpty")}
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
              {t("directoryFilters.clear")}
            </Button>
          ) : null}
        </div>
      }
    >
      {children}
    </DirectoryToolbar>
  );
}
