"use client";

import { SportIcon } from "@bokdy/icons";
import { Button, Tooltip, TooltipContent, TooltipTrigger, cn } from "@bokdy/ui";
import { ExternalLink, LayoutGrid, MapPin, Pencil } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { EntityAvatar } from "@/components/entity/avatar";
import {
  SoftIconChip,
  SOFT_ICON_TONES,
  type SoftIconToneKey,
} from "@/components/entity/soft-icon-chip";
import {
  SoftStatusChip,
  type SoftStatusToneKey,
} from "@/components/entity/soft-status-chip";
import { Link } from "@/i18n/navigation";
import { useMapsConfig } from "@/hooks/use-maps";
import {
  currentBranchAddress,
  type Branch,
  type BranchStatus,
} from "@/lib/api/branches";
import type { Sport } from "@/lib/api/sports";
import { mapsViewUrl } from "@/lib/maps/view-url";

const BRANCH_STATUS_TONE: Record<BranchStatus, SoftStatusToneKey> = {
  active: "emerald",
  inactive: "muted",
  maintenance: "amber",
  archived: "muted",
};

const SPORT_CHIP_TONES: SoftIconToneKey[] = ["sky", "emerald", "amber", "rose"];
const MAX_SPORT_CHIPS = 5;

type BranchCardProps = {
  branch: Branch;
  orgId: string;
  sports: Sport[];
  onEdit: (branch: Branch) => void;
};

function sportLabel(sport: Sport, locale: string): string {
  if (locale.startsWith("vi")) {
    return sport.name_vi || sport.name || sport.name_en;
  }
  return sport.name_en || sport.name || sport.name_vi;
}

export function BranchCard({ branch, orgId, sports, onEdit }: BranchCardProps) {
  const t = useTranslations("organization.detailBranches");
  const tb = useTranslations("organization.branch");
  const locale = useLocale();
  const { data: mapsConfig } = useMapsConfig();
  const address = currentBranchAddress(branch);
  const addressLine = address?.address_line_1?.trim() || "";
  const lat = address?.latitude;
  const lng = address?.longitude;
  const mapsHref =
    mapsConfig?.view_url_template &&
    lat != null &&
    lng != null &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng)
      ? mapsViewUrl(mapsConfig.view_url_template, lat, lng)
      : null;
  const bannerSrc = branch.banner_file_id
    ? `/api/go/files/${branch.banner_file_id}`
    : null;
  const logoSrc = branch.logo_file_id
    ? `/api/go/files/${branch.logo_file_id}`
    : null;
  const sportById = new Map(sports.map((sport) => [sport.id, sport]));
  const branchSports = (branch.sport_ids ?? [])
    .map((id) => sportById.get(id))
    .filter((sport): sport is Sport => Boolean(sport));
  const visibleSports = branchSports.slice(0, MAX_SPORT_CHIPS);
  const overflowSports = branchSports.slice(MAX_SPORT_CHIPS);
  const detailHref = `/organizations/${orgId}/branches/${branch.id}`;

  return (
    <div
      className={cn(
        "soft-elevated group relative overflow-hidden rounded-2xl border-0",
        "transition-[box-shadow,ring] duration-200",
        "hover:ring-2 hover:ring-sky-500/15",
      )}
    >
      <Link
        href={detailHref}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <div
          className={cn(
            "relative h-28 w-full overflow-hidden",
            !bannerSrc &&
              "bg-linear-to-br from-sky-500/20 via-sky-500/5 to-muted bg-[radial-gradient(ellipse_at_30%_20%,rgba(56,189,248,0.18),transparent_55%)]",
          )}
        >
          {bannerSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerSrc}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div className="relative px-4 pt-0">
          <div className="-mt-8 mb-3 flex items-end justify-between gap-2">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-card bg-card shadow-sm">
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc} alt="" className="size-full object-cover" />
              ) : (
                <EntityAvatar
                  name={branch.name}
                  size="lg"
                  className="size-full rounded-none"
                />
              )}
            </div>
            <div className="size-9 shrink-0" aria-hidden />
          </div>

          <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
            <p className="min-w-0 truncate text-sm font-semibold text-foreground">
              {branch.name}
            </p>
            <SoftStatusChip
              label={tb(`status.${branch.status}`)}
              tone={BRANCH_STATUS_TONE[branch.status]}
              size="sm"
            />
          </div>

          <p className="mb-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin
              className="mt-0.5 size-3.5 shrink-0 opacity-70"
              aria-hidden
            />
            <span
              className={cn(
                "line-clamp-2",
                !addressLine && "italic opacity-80",
              )}
            >
              {addressLine || tb("addressEmptyHint")}
            </span>
          </p>
        </div>
      </Link>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 text-xs font-medium text-foreground/80">
        <Link
          href={detailHref}
          className="inline-flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <SoftIconChip
            tone="sky"
            className="size-6 rounded-md"
            icon={<LayoutGrid className="size-3.5" aria-hidden />}
          />
          <span>{t("courtCount", { count: branch.court_count ?? 0 })}</span>
        </Link>
        {mapsHref ? (
          <>
            <span className="text-muted-foreground/50" aria-hidden>
              ·
            </span>
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sky-700 hover:underline dark:text-sky-300"
            >
              <ExternalLink className="size-3" aria-hidden />
              {tb("openInMaps")}
            </a>
          </>
        ) : null}
      </div>

      {branchSports.length > 0 ? (
        <Link
          href={detailHref}
          className="mt-3 block px-4 pb-4 outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ul className="flex flex-wrap gap-1.5" aria-label={tb("fieldSports")}>
            {visibleSports.map((sport, index) => {
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
            {overflowSports.length > 0 ? (
              <li>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="inline-flex size-9 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground"
                      tabIndex={0}
                      aria-label={overflowSports
                        .map((s) => sportLabel(s, locale))
                        .join(", ")}
                    >
                      +{overflowSports.length}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {overflowSports
                      .map((s) => sportLabel(s, locale))
                      .join(", ")}
                  </TooltipContent>
                </Tooltip>
              </li>
            ) : null}
          </ul>
        </Link>
      ) : (
        <div className="pb-4" />
      )}

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="absolute top-20 right-3 z-10 size-9 shrink-0 rounded-full border-border/60 bg-card shadow-none hover:bg-muted/40"
        aria-label={tb("editProfile")}
        onClick={() => onEdit(branch)}
      >
        <Pencil className="size-3.5" />
      </Button>
    </div>
  );
}
