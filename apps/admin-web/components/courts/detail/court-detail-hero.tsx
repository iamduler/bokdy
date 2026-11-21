"use client";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { ArrowLeft, Copy, Pencil, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { sportLabel } from "@/components/branches/branch-sports-chips";
import { COURT_STATUS_TONE } from "@/components/courts/court-status";
import { useCourtDetail } from "@/components/courts/detail/court-detail-context";
import { EntityAvatar } from "@/components/entity/avatar";
import { EntityCoverSplit } from "@/components/entity/cover-split";
import { EntityStatusBadge } from "@/components/entity/status-badge";
import { usePageShellLeading } from "@/components/shell/shell-title";
import { useCourtGallery } from "@/hooks/use-courts";
import { useSports } from "@/hooks/use-sports";
import { Link } from "@/i18n/navigation";
import { courtGalleryFileSrc } from "@/lib/api/courts";
import { mediaKindFromMime } from "@/lib/media-kind";

function localizedText(locale: string, vi?: string | null, en?: string | null) {
  const primary = locale.startsWith("vi") ? vi : en;
  const fallback = locale.startsWith("vi") ? en : vi;
  return primary?.trim() || fallback?.trim() || "";
}

type CourtDetailHeroProps = {
  onEdit: () => void;
  onDuplicate: () => void;
  onStatus: () => void;
};

/** Identity card and cover for the court overview. */
export function CourtDetailHero({ onEdit, onDuplicate, onStatus }: CourtDetailHeroProps) {
  const t = useTranslations("organization.court");
  const ts = useTranslations("shell");
  const locale = useLocale();
  const { court, organizationId, courtId } = useCourtDetail();
  const gallery = useCourtGallery(organizationId, courtId);
  const { data: sports = [] } = useSports();
  const [coverFailed, setCoverFailed] = useState(false);

  const archived = court.status === "archived";
  const cover = (gallery.data ?? []).find(
    (item) => item.is_cover && mediaKindFromMime(item.mime_type) === "image",
  );
  const coverId = cover?.file_id;

  usePageShellLeading(
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="size-9 rounded-full text-muted-foreground hover:bg-muted/70"
    >
      <Link href={`/branches/${court.branch_id}/courts`} aria-label={ts("menuBack")}>
        <ArrowLeft className="size-4" />
      </Link>
    </Button>,
  );

  useEffect(() => {
    setCoverFailed(false);
  }, [coverId]);

  const sport = sports.find((item) => item.id === court.sport_id);
  const sportName = sport ? sportLabel(sport, locale) : "";
  const env = court.environment ?? "unspecified";
  const subtitle = [sportName, env === "unspecified" ? "" : t(`environment.${env}`)]
    .filter(Boolean)
    .join(" · ");
  const name = localizedText(locale, court.name_vi, court.name_en) || court.name;
  const coverSrc = cover && !coverFailed ? courtGalleryFileSrc(cover) : undefined;

  return (
    <EntityCoverSplit
      mediaClassName={
        !coverSrc
          ? "bg-linear-to-br from-sky-500/20 via-sky-500/5 to-muted bg-[radial-gradient(ellipse_at_30%_20%,rgba(56,189,248,0.18),transparent_55%)]"
          : undefined
      }
      media={
        coverSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt=""
            className="absolute inset-0 size-full object-cover"
            onError={() => setCoverFailed(true)}
          />
        ) : null
      }
    >
      <div className="flex items-start gap-3 pr-28">
        <EntityAvatar name={name} className="size-12" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">{name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <EntityStatusBadge label={t(`status.${court.status}`)} tone={COURT_STATUS_TONE[court.status]} />
          </div>
          {subtitle ? <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                type="button"
                size="icon-sm"
                aria-label={t("editCourt")}
                disabled={archived}
                onClick={onEdit}
              >
                <Pencil className="size-4" aria-hidden />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("editCourt")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" size="icon-sm" aria-label={t("duplicate")} onClick={onDuplicate}>
              <Copy className="size-4" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("duplicate")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                type="button"
                size="icon-sm"
                aria-label={t("updateStatus")}
                disabled={archived}
                onClick={onStatus}
              >
                <RefreshCw className="size-4" aria-hidden />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("updateStatus")}</TooltipContent>
        </Tooltip>
      </div>
    </EntityCoverSplit>
  );
}
