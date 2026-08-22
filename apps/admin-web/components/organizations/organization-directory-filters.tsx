"use client";

import {
  Button,
  Combobox,
  Input,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
  type ComboboxOption,
} from "@bokdy/ui";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useProvinces } from "@/hooks/use-admin-units";
import { useRouter } from "@/i18n/navigation";
import type { OrgStatus } from "@/lib/api/admin";

const ORG_STATUSES: OrgStatus[] = ["active", "inactive", "suspended", "archived"];

type OrganizationDirectoryFiltersProps = {
  q: string;
  status: OrgStatus | "";
  provinceId: string;
  resultCount: number;
};

export function OrganizationDirectoryFilters({
  q,
  status,
  provinceId,
  resultCount,
}: OrganizationDirectoryFiltersProps) {
  const t = useTranslations("organization");
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

  const hasFilters = Boolean(q.trim() || status || provinceId);

  const statusOptions = useMemo<ComboboxOption[]>(
    () => [
      {
        value: "",
        label: t("directoryFilters.statusPlaceholder"),
        keywords: t("directoryFilters.statusPlaceholder"),
      },
      ...ORG_STATUSES.map((s) => ({
        value: s,
        label: t(`status.${s}`),
        keywords: `${s} ${t(`status.${s}`)}`,
      })),
    ],
    [t],
  );

  const planOptions = useMemo<ComboboxOption[]>(
    () => [
      {
        value: "",
        label: t("directoryFilters.plan"),
        keywords: t("directoryFilters.plan"),
      },
    ],
    [t],
  );

  const provinceOptions = useMemo<ComboboxOption[]>(
    () => [
      {
        value: "",
        label: t("directoryFilters.province"),
        keywords: t("directoryFilters.province"),
      },
      ...provinces.map((p) => ({
        value: p.id,
        label: p.name,
        keywords: `${p.code} ${p.name} ${p.name_en} ${p.name_vi}`,
      })),
    ],
    [provinces, t],
  );

  function clearFilters() {
    setSearch("");
    replaceParams({ q: undefined, status: undefined, province_id: undefined });
  }

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-border px-4 py-2.5 md:flex-row md:items-center md:gap-2 md:px-6">
      <div className="relative max-w-[260px] flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("directoryFilters.searchPlaceholder")}
          autoComplete="off"
          aria-label={t("directoryFilters.searchPlaceholder")}
          className="h-8 pl-8 text-xs"
        />
      </div>

      <FilterCombobox
        value={status}
        onChange={(value) => replaceParams({ status: value || undefined })}
        ariaLabel={t("statusFilter")}
        placeholder={t("directoryFilters.statusPlaceholder")}
        options={statusOptions}
        searchPlaceholder={t("directoryFilters.filterSearch")}
        emptyText={t("directoryFilters.filterEmpty")}
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <FilterCombobox
              value=""
              onChange={() => undefined}
              disabled
              ariaLabel={t("directoryFilters.plan")}
              placeholder={t("directoryFilters.plan")}
              options={planOptions}
              searchPlaceholder={t("directoryFilters.filterSearch")}
              emptyText={t("directoryFilters.filterEmpty")}
            />
          </span>
        </TooltipTrigger>
        <TooltipContent>{t("directoryFilters.planUnavailable")}</TooltipContent>
      </Tooltip>

      <FilterCombobox
        value={provinceId}
        onChange={(value) => replaceParams({ province_id: value || undefined })}
        ariaLabel={t("directoryFilters.province")}
        placeholder={t("directoryFilters.province")}
        options={provinceOptions}
        searchPlaceholder={t("directoryFilters.filterSearch")}
        emptyText={t("directoryFilters.filterEmpty")}
        className="min-w-[9rem]"
      />

      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs text-muted-foreground"
          onClick={clearFilters}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          {t("directoryFilters.clear")}
        </Button>
      ) : null}

      <div className="flex-1" />

      <span className="text-xs text-muted-foreground">
        {t("directoryFilters.resultCount", { count: resultCount })}
      </span>
    </div>
  );
}

function FilterCombobox({
  value,
  onChange,
  disabled,
  ariaLabel,
  placeholder,
  options,
  searchPlaceholder,
  emptyText,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel: string;
  placeholder: string;
  options: ComboboxOption[];
  searchPlaceholder: string;
  emptyText: string;
  className?: string;
}) {
  return (
    <Combobox
      value={value}
      onValueChange={onChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyText={emptyText}
      disabled={disabled}
      aria-label={ariaLabel}
      searchable
      align="start"
      className={cn(
        "h-8 min-w-[7.5rem] rounded-md border border-border bg-background px-2.5 text-xs font-normal text-foreground shadow-none hover:bg-background hover:text-foreground data-[state=open]:ring-1 data-[state=open]:ring-primary/20",
        disabled && "cursor-not-allowed opacity-60",
        !value && !disabled && "text-muted-foreground",
        className,
      )}
    />
  );
}
