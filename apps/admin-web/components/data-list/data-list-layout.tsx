"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI directory
 */

import {
  Badge,
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@bokdy/ui";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";

import {
  DataListStats,
  type DataListStatItem,
} from "@/components/data-list/data-list-stats";

export type DataListStatusTab = {
  value: string;
  label: string;
  count?: number;
  /** Optional status color dot (Vessa-style). */
  dotClass?: string;
};

type DataListLayoutProps = {
  title: string;
  eyebrow?: string;
  stats: DataListStatItem[];
  statsLoading?: boolean;
  /** Mass actions beside the primary CTA in the title row. */
  actions?: ReactNode;
  /** Outline secondary (e.g. Export CSV). */
  secondaryAction?: ReactNode;
  primaryAction?: ReactNode;
  /** Soft UI status pill tabs (All / status…). Empty string = All. */
  statusTabs: DataListStatusTab[];
  statusValue: string;
  onStatusChange: (value: string) => void;
  statusAriaLabel?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchAriaLabel?: string;
  advancedLabel: string;
  advancedContent: ReactNode;
  hasAdvancedFilters?: boolean;
  advancedFilterCount?: number;
  onClearFilters?: () => void;
  clearLabel?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Shared Soft UI directory chrome: title + KPI cards + table card (tabs/search/table).
 * Modules pass data and slots; they do not restack this layout.
 */
export function DataListLayout({
  title,
  eyebrow,
  stats,
  statsLoading,
  actions,
  secondaryAction,
  primaryAction,
  statusTabs,
  statusValue,
  onStatusChange,
  statusAriaLabel,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  advancedLabel,
  advancedContent,
  hasAdvancedFilters,
  advancedFilterCount = 0,
  onClearFilters,
  clearLabel,
  children,
  className,
}: DataListLayoutProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-5 overflow-hidden px-3 py-3 md:gap-4 md:px-4 md:py-4",
        className,
      )}
    >
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-medium tracking-wide text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
          {secondaryAction}
          {primaryAction}
        </div>
      </div>

      <DataListStats items={stats} isLoading={statsLoading} />

      <div className="soft-elevated flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border-0">
        <div className="flex shrink-0 flex-col gap-3 border-b border-border/40 px-4 py-3.5 md:flex-row md:items-center md:justify-between md:px-6 md:py-4">
          <div
            className="min-w-0 flex-1 overflow-x-auto soft-scrollbar"
            role="tablist"
            aria-label={statusAriaLabel}
          >
            <div className="inline-flex w-max max-w-full items-center rounded-full border border-border/60 bg-card p-1 shadow-sm">
              {statusTabs.map((tab) => {
                const active = statusValue === tab.value;
                return (
                  <button
                    key={tab.value || "__all"}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onStatusChange(tab.value)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "bg-sky-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.dotClass && !active ? (
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          tab.dotClass,
                        )}
                        aria-hidden
                      />
                    ) : null}
                    <span>{tab.label}</span>
                    {typeof tab.count === "number" ? (
                      <span
                        className={cn(
                          "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                          active
                            ? "bg-white/20 text-white"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {tab.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <InputGroup className="min-w-0 flex-1 overflow-hidden rounded-full border-0 bg-muted/50 shadow-none sm:w-60 sm:flex-none has-[[data-slot=input-group-control]:focus-visible]:ring-1">
              <InputGroupInput
                type="search"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                autoComplete="off"
                aria-label={searchAriaLabel ?? searchPlaceholder}
                className="rounded-full border-0 bg-transparent shadow-none"
              />
              <InputGroupAddon align="inline-start">
                <Search aria-hidden />
              </InputGroupAddon>
            </InputGroup>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="relative size-9 rounded-full bg-muted/50"
                  aria-label={advancedLabel}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {advancedFilterCount > 0 ? (
                    <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]">
                      {advancedFilterCount}
                    </Badge>
                  ) : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 space-y-3 p-3">
                {advancedContent}
              </PopoverContent>
            </Popover>

            {hasAdvancedFilters && onClearFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 rounded-full"
                onClick={onClearFilters}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                {clearLabel}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
