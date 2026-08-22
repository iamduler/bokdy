"use client";

import {
  Building2,
  DollarSign,
  Heart,
  MapPin,
  Percent,
  Users,
  UsersRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

import { cn } from "@bokdy/ui";

import { useOrganizationDetail } from "../organization-detail-context";
import { DETAIL_MOCK } from "../shared/detail-mock-data";

const METRIC_CONFIG = [
  { key: "branches", icon: MapPin, tone: "text-primary", real: true },
  { key: "courts", icon: Building2, tone: "text-violet-600 dark:text-violet-400", real: false },
  { key: "staff", icon: Users, tone: "text-emerald-600 dark:text-emerald-400", real: false },
  { key: "players", icon: UsersRound, tone: "text-teal-600 dark:text-teal-400", real: false },
  { key: "revenue", icon: DollarSign, tone: "text-amber-600 dark:text-amber-400", real: false },
  { key: "occupancy", icon: Percent, tone: "text-amber-600 dark:text-amber-400", real: false },
  { key: "health", icon: Heart, tone: "text-emerald-600 dark:text-emerald-400", real: false },
] as const satisfies ReadonlyArray<{
  key: string;
  icon: LucideIcon;
  tone: string;
  real: boolean;
}>;

function metricValue(key: (typeof METRIC_CONFIG)[number]["key"], branchCount: number): string {
  switch (key) {
    case "branches":
      return String(branchCount);
    case "courts":
      return String(DETAIL_MOCK.courts);
    case "staff":
      return String(DETAIL_MOCK.staff);
    case "players":
      return DETAIL_MOCK.players.toLocaleString();
    case "revenue":
      return DETAIL_MOCK.monthlyGmv;
    case "occupancy":
      return `${DETAIL_MOCK.occupancy}%`;
    case "health":
      return String(DETAIL_MOCK.healthScore);
    default:
      return "—";
  }
}

export function OrganizationOverviewMetrics() {
  const t = useTranslations("organization.detailMetrics");
  const { org } = useOrganizationDetail();

  return (
    <div className="shrink-0 overflow-x-auto soft-scrollbar px-6 pb-1">
      <div className="flex gap-2">
        {METRIC_CONFIG.map((item) => {
          const Icon = item.icon;
          const val = metricValue(item.key, org.branch_count ?? 0);
          const valueTone =
            item.key === "occupancy"
              ? DETAIL_MOCK.occupancy >= 70
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
              : item.key === "health"
                ? DETAIL_MOCK.healthScore >= 80
                  ? "text-emerald-600 dark:text-emerald-400"
                  : DETAIL_MOCK.healthScore >= 60
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-destructive"
                : item.tone;

          return (
            <div
              key={item.key}
              className="shrink-0 rounded-[10px] border border-border bg-card/50 px-3.5 py-2.5"
            >
              <Icon className={cn("mb-1.5 h-[18px] w-[18px]", item.tone)} aria-hidden />
              <div className={cn("text-xl font-extrabold leading-none tracking-tight", valueTone)}>
                {val}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t(item.key)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
