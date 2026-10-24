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
};

type EntityDetailTabsProps = {
  tabs: EntityDetailTabItem[];
  ariaLabel?: string;
  className?: string;
};

function TabLabel({
  label,
  count,
  active,
}: {
  label: string;
  count?: number;
  active?: boolean;
}) {
  return (
    <>
      <span>{label}</span>
      {typeof count === "number" ? (
        <span
          className={cn(
            "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
            active
              ? "bg-white/20 text-white"
              : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      ) : null}
    </>
  );
}

/** Soft UI segmented pill track for entity detail. */
export function EntityDetailTabs({
  tabs,
  ariaLabel,
  className,
}: EntityDetailTabsProps) {
  return (
    <div
      className={cn(
        "shrink-0 overflow-x-auto soft-scrollbar px-4 pb-2.5",
        className,
      )}
      role="tablist"
      aria-label={ariaLabel}
    >
      <div className="inline-flex w-max max-w-full items-center rounded-full border border-border/60 bg-card p-1 shadow-sm">
        {tabs.map((tab) => {
          const classNameTab = cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors h-9",
            tab.disabled
              ? "cursor-not-allowed text-muted-foreground/50"
              : tab.active
                ? "bg-sky-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
          );

          const content: ReactNode = (
            <TabLabel label={tab.label} count={tab.count} active={tab.active} />
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
