"use client";

import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { ArrowLeft, Pencil } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { BranchFormSheet } from "@/components/branches/branch-form-sheet";
import { sportLabel } from "@/components/branches/branch-sports-chips";
import { BranchArchiveButton } from "@/components/branches/branch-archive-button";
import { BRANCH_STATUS_TONE } from "@/components/branches/branch-status";
import { EntityAvatar, entityFileSrc } from "@/components/entity/avatar";
import { EntityCoverSplit } from "@/components/entity/cover-split";
import { EntityStatusBadge } from "@/components/entity/status-badge";
import { usePageShellLeading } from "@/components/shell/shell-title";
import { useSports } from "@/hooks/use-sports";
import { Link } from "@/i18n/navigation";

import { useBranchDetail } from "./branch-detail-context";

function padCount(value: number): string {
  if (value < 100) return String(value).padStart(2, "0");
  return String(value);
}

/** Identity card and banner for the branch overview. */
export function BranchDetailHero() {
  const tb = useTranslations("organization.branch");
  const th = useTranslations("organization.branchDetail.hero");
  const ts = useTranslations("shell");
  const locale = useLocale();
  const { branch, organizationId } = useBranchDetail();
  const [editing, setEditing] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);

  usePageShellLeading(
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="size-9 rounded-full text-muted-foreground hover:bg-muted/70"
    >
      <Link href={`/organizations/${organizationId}/branches`} aria-label={ts("menuBack")}>
        <ArrowLeft className="size-4" />
      </Link>
    </Button>,
  );

  useEffect(() => {
    setBannerFailed(false);
  }, [branch.banner_file_id]);

  const { data: sports = [] } = useSports();
  const sportIds = branch.sport_ids ?? [];
  const sportLine = sportIds
    .map((id) => sports.find((sport) => sport.id === id))
    .filter((sport) => sport != null)
    .map((sport) => sportLabel(sport, locale))
    .join(" · ");
  const bannerSrc =
    branch.banner_file_id && !bannerFailed ? entityFileSrc(branch.banner_file_id) : undefined;

  return (
    <>
      <EntityCoverSplit
        mediaClassName={
          !bannerSrc
            ? "bg-linear-to-br from-sky-500/20 via-sky-500/5 to-muted bg-[radial-gradient(ellipse_at_30%_20%,rgba(56,189,248,0.18),transparent_55%)]"
            : undefined
        }
        media={
          bannerSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerSrc}
              alt=""
              className="absolute inset-0 size-full object-cover"
              onError={() => setBannerFailed(true)}
            />
          ) : null
        }
      >
        <div className="flex items-start gap-3 pr-20">
          <EntityAvatar
            name={branch.name}
            src={entityFileSrc(branch.logo_file_id)}
            className="size-12"
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {branch.name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <EntityStatusBadge
                label={tb(`status.${branch.status}`)}
                tone={BRANCH_STATUS_TONE[branch.status]}
              />
            </div>
            {sportLine ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">{sportLine}</p>
            ) : null}
          </div>
        </div>
        {branch.status === "archived" ? null : (
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon-sm"
                  aria-label={tb("editProfile")}
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="size-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{tb("editProfile")}</TooltipContent>
            </Tooltip>
            <BranchArchiveButton
              organizationId={organizationId}
              branchId={branch.id}
              name={branch.name}
              status={branch.status}
            />
          </div>
        )}
        <div className="mt-auto grid grid-cols-2 border-t border-border/60">
          <Metric value={padCount(branch.court_count ?? 0)} label={th("courtCount")} edge="start" />
          <Metric value={padCount(sportIds.length)} label={th("sportCount")} />
        </div>
      </EntityCoverSplit>
      <BranchFormSheet
        open={editing}
        mode="edit"
        organizationId={organizationId}
        branch={branch}
        onOpenChange={(open) => {
          if (!open) setEditing(false);
        }}
      />
    </>
  );
}

function Metric({
  value,
  label,
  edge = "next",
}: {
  value: string;
  label: string;
  edge?: "start" | "next";
}) {
  return (
    <div
      className={cn(
        "py-1.5",
        edge === "start" ? "pr-4" : "border-l border-border/60 pl-4",
      )}
    >
      <p className="text-lg font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
