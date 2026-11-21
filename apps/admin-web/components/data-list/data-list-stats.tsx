"use client";

import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

import {
  SoftIconChip,
  type SoftIconToneKey,
} from "@/components/entity/soft-icon-chip";
import { Link } from "@/i18n/navigation";

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
  /** Opens this path when the card is clicked. */
  href?: string;
};

type DataListStatsProps = {
  items: DataListStatItem[];
  isLoading?: boolean;
  className?: string;
  /** Directory lists use the tighter cards. Dashboard keeps the large default. */
  density?: "default" | "compact";
};

/** Soft UI KPI card row — shared by every directory module. */
export function DataListStats({
  items,
  isLoading,
  className,
  density = "default",
}: DataListStatsProps) {
  const compact = density === "compact";
  return (
    <div
      className={cn(
        "grid shrink-0 grid-cols-2 lg:grid-cols-4",
        compact ? "gap-2" : "gap-3 lg:gap-4",
        className,
      )}
    >
      {items.map((item) => {
        const value = (
          <p
            className={cn(
              "font-bold tracking-tight tabular-nums",
              compact ? "shrink-0 text-lg" : "text-2xl md:text-[1.75rem]",
              item.tone ?? "text-foreground",
            )}
          >
            {isLoading ? "—" : item.value}
          </p>
        );
        const secondary =
          item.secondary ? (
            <p
              className={cn(
                "min-w-0 truncate text-xs",
                item.secondaryTone ?? "text-muted-foreground",
              )}
            >
              {item.secondary}
            </p>
          ) : null;
        const card = (
          <>
            <div className={cn("flex min-w-0 items-center", compact ? "gap-2" : "gap-2.5")}>
              {item.icon ? (
                <SoftIconChip
                  icon={item.icon}
                  tone={item.iconTone}
                  color={item.iconColor}
                  backgroundColor={item.iconBackground}
                />
              ) : null}
              <p
                className={cn(
                  "min-w-0 line-clamp-2 font-medium text-muted-foreground",
                  compact ? "text-xs leading-tight" : "text-sm leading-snug",
                )}
              >
                {item.label}
              </p>
            </div>
            {compact ? (
              <div className="flex min-w-0 items-baseline gap-2">
                {value}
                {secondary}
                {item.badge}
              </div>
            ) : (
              <div className="min-w-0">
                {value}
                {item.secondary || item.badge ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {secondary}
                    {item.badge}
                  </div>
                ) : null}
              </div>
            )}
          </>
        );
        const cardClass = cn(
          "soft-elevated flex min-w-0 flex-col border-0",
          compact ? "gap-1 px-3 py-2.5" : "gap-2 px-4 py-4 sm:px-5",
        );
        if (item.href) {
          return (
            <Link key={item.key} href={item.href} className={cardClass}>
              {card}
            </Link>
          );
        }
        return (
          <div key={item.key} className={cardClass}>
            {card}
          </div>
        );
      })}
    </div>
  );
}
