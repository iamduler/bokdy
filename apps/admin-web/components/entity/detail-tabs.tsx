"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI detail tabs
 */

import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";

export type EntityDetailTabItem = {
  id: string;
  label: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  /** Optional Soft count chip (e.g. subscriptions badge). */
  count?: number;
  /** Optional leading icon (vertical rail). */
  icon?: ReactNode;
};

type EntityDetailTabsProps = {
  tabs: EntityDetailTabItem[];
  ariaLabel?: string;
  className?: string;
  /** Optional section heading above a vertical rail. */
  title?: string;
  /**
   * `pill` — Soft UI segmented track (directories / org chrome).
   * `underline` — full-width horizontal content tabs.
   * `vertical` — left rail of content tabs (branch mockup).
   */
  variant?: "pill" | "underline" | "vertical";
};

function TabLabel({
  label,
  count,
  active,
  variant,
  icon,
}: {
  label: string;
  count?: number;
  active?: boolean;
  variant: NonNullable<EntityDetailTabsProps["variant"]>;
  icon?: ReactNode;
}) {
  return (
    <>
      {icon ? (
        <span
          className="inline-flex size-4 shrink-0 items-center justify-center [&_svg]:size-4"
          aria-hidden
        >
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 truncate">{label}</span>
      {typeof count === "number" ? (
        <span
          className={cn(
            "inline-flex min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
            variant === "pill"
              ? active
                ? "bg-white/20 text-white"
                : "bg-muted text-muted-foreground"
              : active
                ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      ) : null}
    </>
  );
}

function tabClassName(
  tab: EntityDetailTabItem,
  variant: NonNullable<EntityDetailTabsProps["variant"]>,
) {
  if (variant === "vertical") {
    return cn(
      "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors md:w-full md:whitespace-normal",
      tab.disabled
        ? "cursor-not-allowed text-muted-foreground/50"
        : tab.active
          ? "bg-sky-500 text-white"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
    );
  }

  if (variant === "underline") {
    return cn(
      "-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
      tab.disabled
        ? "cursor-not-allowed border-transparent text-muted-foreground/50"
        : tab.active
          ? "border-sky-500 text-sky-700 dark:text-sky-300"
          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
    );
  }

  return cn(
    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
    tab.disabled
      ? "cursor-not-allowed text-muted-foreground/50"
      : tab.active
        ? "bg-sky-500 text-white shadow-sm"
        : "text-muted-foreground hover:text-foreground",
  );
}

/** Soft UI detail tabs — pill, underline, or vertical rail. */
export function EntityDetailTabs({
  tabs,
  ariaLabel,
  className,
  title,
  variant = "pill",
}: EntityDetailTabsProps) {
  const isVertical = variant === "vertical";

  return (
    <div
      className={cn(
        isVertical
          ? "flex w-full flex-col gap-2 overflow-x-auto p-2 soft-scrollbar md:overflow-visible"
          : "shrink-0 overflow-x-auto soft-scrollbar",
        variant === "underline" && "border-b border-border/50 px-4 md:px-6",
        variant === "pill" && "px-4 pb-2.5",
        className,
      )}
    >
      {isVertical && title ? (
        <p className="hidden px-3 pt-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase md:block">
          {title}
        </p>
      ) : null}
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation={isVertical ? "vertical" : "horizontal"}
        className={cn(
          isVertical
            ? "inline-flex w-max max-w-none items-center gap-0.5 md:flex md:w-full md:flex-col md:items-stretch"
            : "inline-flex w-max max-w-full items-center",
          variant === "pill" &&
            "rounded-full border border-border/60 bg-card p-1 shadow-sm",
        )}
      >
        {tabs.map((tab) => {
          const classNameTab = tabClassName(tab, variant);
          const content: ReactNode = (
            <TabLabel
              label={tab.label}
              count={tab.count}
              active={tab.active}
              variant={variant}
              icon={tab.icon}
            />
          );

          if (tab.disabled || !tab.href) {
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                disabled
                aria-selected={false}
                className={classNameTab}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={tab.id}
              href={tab.href}
              role="tab"
              aria-selected={tab.active}
              className={classNameTab}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
