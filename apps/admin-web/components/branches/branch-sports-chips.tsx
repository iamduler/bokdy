"use client";

import { SportIcon } from "@bokdy/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { useLocale } from "next-intl";

import {
  SOFT_ICON_TONES,
  type SoftIconToneKey,
} from "@/components/entity/soft-icon-chip";
import type { Sport } from "@/lib/api/sports";

const SPORT_CHIP_TONES: SoftIconToneKey[] = ["sky", "emerald", "amber", "rose"];
const DEFAULT_MAX = 5;

export function sportLabel(sport: Sport, locale: string): string {
  if (locale.startsWith("vi")) {
    return sport.name_vi || sport.name || sport.name_en;
  }
  return sport.name_en || sport.name || sport.name_vi;
}

type BranchSportsChipsProps = {
  sports: Sport[];
  sportIds: string[];
  maxVisible?: number;
  "aria-label"?: string;
  className?: string;
};

export function BranchSportsChips({
  sports,
  sportIds,
  maxVisible = DEFAULT_MAX,
  "aria-label": ariaLabel,
  className,
}: BranchSportsChipsProps) {
  const locale = useLocale();
  const sportById = new Map(sports.map((sport) => [sport.id, sport]));
  const branchSports = sportIds
    .map((id) => sportById.get(id))
    .filter((sport): sport is Sport => Boolean(sport));
  if (branchSports.length === 0) return null;

  const visible = branchSports.slice(0, maxVisible);
  const overflow = branchSports.slice(maxVisible);

  return (
    <ul className={className ?? "flex flex-wrap gap-1.5"} aria-label={ariaLabel}>
      {visible.map((sport, index) => {
        const label = sportLabel(sport, locale);
        const tone = SPORT_CHIP_TONES[index % SPORT_CHIP_TONES.length]!;
        const colors = SOFT_ICON_TONES[tone];
        return (
          <li key={sport.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex size-9 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: colors.backgroundColor,
                    color: colors.color,
                  }}
                  tabIndex={0}
                  aria-label={label}
                >
                  <SportIcon
                    icon={sport.icon}
                    code={sport.code}
                    className="size-4.5"
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">{label}</TooltipContent>
            </Tooltip>
          </li>
        );
      })}
      {overflow.length > 0 ? (
        <li>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="inline-flex size-9 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground"
                tabIndex={0}
                aria-label={overflow.map((s) => sportLabel(s, locale)).join(", ")}
              >
                +{overflow.length}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              {overflow.map((s) => sportLabel(s, locale)).join(", ")}
            </TooltipContent>
          </Tooltip>
        </li>
      ) : null}
    </ul>
  );
}
