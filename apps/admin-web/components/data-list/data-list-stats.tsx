"use client";

import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

export type DataListStatItem = {
  key: string;
  label: string;
  value: string | number;
  /** Optional secondary line under the value (e.g. units). */
  secondary?: string;
  /** Soft UI icon chip. */
  icon?: ReactNode;
  /** Icon chip background/text tone classes. */
  iconTone?: string;
  /** Value text tone. */
  tone?: string;
  /** Secondary line tone (e.g. urgency). */
  secondaryTone?: string;
  /** Optional Vessa-like chip beside secondary (e.g. "1 late"). */
  badge?: ReactNode;
};

type DataListStatsProps = {
  items: DataListStatItem[];
  isLoading?: boolean;
  className?: string;
};

/** Soft UI KPI card row — shared by every directory module. */
export function DataListStats({ items, isLoading, className }: DataListStatsProps) {
  return (
    <div
      className={cn(
        "grid shrink-0 grid-cols-2 gap-3 md:grid-cols-4 md:gap-4",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.key}
          className="soft-elevated flex min-w-0 items-start gap-3 border-0 p-4 md:p-5"
        >
          {item.icon ? (
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                item.iconTone ?? "bg-primary/10 text-primary",
              )}
            >
              {item.icon}
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-muted-foreground">
              {item.label}
            </p>
            <p
              className={cn(
                "mt-0.5 text-2xl font-semibold tracking-tight tabular-nums md:text-[1.75rem]",
                item.tone ?? "text-foreground",
              )}
            >
              {isLoading ? "—" : item.value}
            </p>
            {item.secondary || item.badge ? (
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {item.secondary ? (
                  <p
                    className={cn(
                      "truncate text-xs",
                      item.secondaryTone ?? "text-muted-foreground",
                    )}
                  >
                    {item.secondary}
                  </p>
                ) : null}
                {item.badge}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
