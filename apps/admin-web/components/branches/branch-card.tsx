"use client";

import { Button, cn } from "@bokdy/ui";
import { LayoutGrid, MapPin, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import { EntityAvatar } from "@/components/entity/avatar";
import { SoftIconChip } from "@/components/entity/soft-icon-chip";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { Link } from "@/i18n/navigation";
import { currentBranchAddress, type Branch } from "@/lib/api/branches";
import type { Sport } from "@/lib/api/sports";

import { BranchSportsChips } from "./branch-sports-chips";
import { BRANCH_STATUS_TONE } from "./branch-status";

type BranchCardProps = {
  branch: Branch;
  orgId: string;
  sports: Sport[];
  onEdit: (branch: Branch) => void;
};

export function BranchCard({ branch, orgId, sports, onEdit }: BranchCardProps) {
  const t = useTranslations("organization.detailBranches");
  const tb = useTranslations("organization.branch");
  const address = currentBranchAddress(branch);
  const addressLine = address?.address_line_1?.trim() || "";
  const bannerSrc = branch.banner_file_id
    ? `/api/go/files/${branch.banner_file_id}`
    : null;
  const logoSrc = branch.logo_file_id
    ? `/api/go/files/${branch.logo_file_id}`
    : null;
  const hasSports = (branch.sport_ids ?? []).length > 0;
  const detailHref = `/branches/${branch.id}`;

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
      </div>

      {hasSports ? (
        <Link
          href={detailHref}
          className="mt-3 block px-4 pb-4 outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <BranchSportsChips
            sports={sports}
            sportIds={branch.sport_ids ?? []}
            aria-label={tb("fieldSports")}
          />
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
