"use client";

import { cn } from "@bokdy/ui";
import { Home, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { sportLabel } from "@/components/branches/branch-sports-chips";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { useSports } from "@/hooks/use-sports";
import { Link } from "@/i18n/navigation";
import type { Court } from "@/lib/api/courts";

import { COURT_STATUS_TONE } from "./court-status";

type CourtCardProps = {
  court: Court;
  branchName?: string;
};

function MetaCell({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 flex min-w-0 items-center gap-1 text-sm font-medium text-foreground">
        {icon}
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

export function CourtCard({ court, branchName }: CourtCardProps) {
  const t = useTranslations("organization.court");
  const locale = useLocale();
  const { data: sports = [] } = useSports();
  const sport = sports.find((item) => item.id === court.sport_id);
  const env = court.environment ?? "unspecified";
  const surface = court.surface ?? "unspecified";
  const detailHref = `/courts/${court.id}`;

  return (
    <Link
      href={detailHref}
      className={cn(
        "soft-elevated group block overflow-hidden rounded-2xl border-0 p-4 outline-none",
        "transition-[box-shadow,ring] duration-200",
        "hover:ring-2 hover:ring-sky-500/15 focus-visible:ring-2 focus-visible:ring-primary/30",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-[15px] font-semibold text-foreground">
          {court.name}
        </p>
        <SoftStatusChip
          label={t(`status.${court.status}`)}
          tone={COURT_STATUS_TONE[court.status]}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-3">
        <MetaCell
          label={t("cardSport")}
          value={sport ? sportLabel(sport, locale) : t("emptyValue")}
        />
        <MetaCell label={t("cardSurface")} value={t(`surface.${surface}`)} />
        <MetaCell
          label={t("cardEnvironment")}
          value={t(`environment.${env}`)}
          icon={
            env === "indoor" ? (
              <Home className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            ) : (
              <Sun className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            )
          }
        />
        <MetaCell
          label={t("cardBranch")}
          value={branchName || t("emptyValue")}
        />
      </div>
    </Link>
  );
}
