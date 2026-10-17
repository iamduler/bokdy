"use client";

import {
  Badge,
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@bokdy/ui";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";

import {
  DataListStats,
  type DataListStatItem,
} from "@/components/data-list/data-list-stats";

export type DataListQuickFilterOption = {
  value: string;
  label: string;
};

export type DataListQuickFilter = {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: DataListQuickFilterOption[];
  placeholder?: string;
};

type DataListLayoutProps = {
  stats: DataListStatItem[];
  statsLoading?: boolean;
  /** Mass actions. Module owns disabled state. Rendered beside the primary CTA. */
  actions?: ReactNode;
  primaryAction?: ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchAriaLabel?: string;
  quickFilter: DataListQuickFilter;
  advancedLabel: string;
  advancedContent: ReactNode;
  hasAdvancedFilters?: boolean;
  /** Applied advanced-filter count, shown on the filter button. */
  advancedFilterCount?: number;
  onClearFilters?: () => void;
  clearLabel?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Shared directory chrome: stats + actions, then search + quick filter + advanced.
 * Modules pass data and slots; they do not restack this layout.
 */
export function DataListLayout({
  stats,
  statsLoading,
  actions,
  primaryAction,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  quickFilter,
  advancedLabel,
  advancedContent,
  hasAdvancedFilters,
  advancedFilterCount = 0,
  onClearFilters,
  clearLabel,
  children,
  className,
}: DataListLayoutProps) {
  const allValue = "__all";

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
      <div className="flex shrink-0 flex-col gap-2 border-b border-border px-4 py-2 md:flex-row md:items-center md:gap-3 md:px-6">
        <DataListStats items={stats} isLoading={statsLoading} />
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {actions}
          {primaryAction}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-b border-border px-4 py-2 sm:flex-row sm:items-center md:px-6">
        <InputGroup className="min-w-0 flex-1 sm:max-w-sm">
          <InputGroupInput
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            autoComplete="off"
            aria-label={searchAriaLabel ?? searchPlaceholder}
          />
          <InputGroupAddon align="inline-start">
            <Search aria-hidden />
          </InputGroupAddon>
        </InputGroup>

        <Select
          value={quickFilter.value || allValue}
          onValueChange={(value) =>
            quickFilter.onChange(value === allValue ? "" : value)
          }
        >
          <SelectTrigger
            className="w-[180px]"
            aria-label={quickFilter.ariaLabel}
          >
            <SelectValue placeholder={quickFilter.placeholder ?? quickFilter.ariaLabel} />
          </SelectTrigger>
          <SelectContent>
            {quickFilter.options.map((option) => (
              <SelectItem
                key={option.value || allValue}
                value={option.value || allValue}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={advancedLabel}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 space-y-3 p-3">
              {advancedContent}
            </PopoverContent>
          </Popover>
          {advancedFilterCount > 0 ? <Badge>{advancedFilterCount}</Badge> : null}
        </div>

        {hasAdvancedFilters && onClearFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={onClearFilters}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            {clearLabel}
          </Button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
