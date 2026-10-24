"use client";

import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

import {
  SoftIconChip,
  type SoftIconToneKey,
} from "@/components/entity/soft-icon-chip";

export type DataListStatItem = {
  key: string;
  label: string;
  value: string | number;
  /** Optional secondary line under the value (e.g. units). */
  secondary?: string;
  /** Soft UI icon chip. */
  icon?: ReactNode;
  /** Soft pastel tone for the icon chip. */
  iconTone?: SoftIconToneKey;
  /** Icon glyph color (CSS) — overrides tone. */
  iconColor?: string;
  /** Icon chip fill (CSS) — overrides tone. */
  iconBackground?: string;
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
export function DataListStats({
  items,
  isLoading,
  className,
}: DataListStatsProps) {
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
          className="soft-elevated flex min-w-0 flex-col gap-2 border-0 px-5 py-4"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            {item.icon ? (
              <SoftIconChip
                icon={item.icon}
                tone={item.iconTone}
                color={item.iconColor}
                backgroundColor={item.iconBackground}
              />
            ) : null}
            <p className="truncate text-sm font-medium text-muted-foreground">
              {item.label}
            </p>
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "text-2xl font-bold tracking-tight tabular-nums md:text-[1.75rem]",
                item.tone ?? "text-foreground",
              )}
            >
              {isLoading ? "—" : item.value}
            </p>
            {item.secondary || item.badge ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
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
