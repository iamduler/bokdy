"use client";

import { cn, RichTextView } from "@bokdy/ui";
import { FileText, Home, LayoutGrid, Sparkles, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { sportLabel } from "@/components/branches/branch-sports-chips";
import { CourtFormSheet } from "@/components/courts/court-form-sheet";
import { CourtGalleryStrip } from "@/components/courts/court-gallery-strip";
import { CourtStatusDialog } from "@/components/courts/court-status-dialog";
import { useCourtDetail } from "@/components/courts/detail/court-detail-context";
import { CourtDetailHero } from "@/components/courts/detail/court-detail-hero";
import { softDetailPanelPad } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { EntityRelationLink } from "@/components/entity/relation-link";
import { SoftChip } from "@/components/entity/soft-chip";
import { useAmenityCatalog } from "@/hooks/use-amenities";
import { useBranch } from "@/hooks/use-branches";
import { useSports } from "@/hooks/use-sports";
import { amenityLabel } from "@/lib/api/amenities";

function localizedText(locale: string, vi?: string | null, en?: string | null) {
  const primary = locale.startsWith("vi") ? vi : en;
  const fallback = locale.startsWith("vi") ? en : vi;
  return primary?.trim() || fallback?.trim() || "";
}

export function CourtOverviewView() {
  const t = useTranslations("organization.court");
  const { court, organizationId, courtId } = useCourtDetail();
  const { data: branch } = useBranch(court.branch_id, organizationId);
  const env = court.environment ?? "unspecified";
  const locale = useLocale();
  const { data: sports = [] } = useSports();
  const amenityCatalog = useAmenityCatalog();
  const sport = sports.find((item) => item.id === court.sport_id);
  const amenityNames = (court.amenity_ids ?? []).map((id) => {
    const amenity = amenityCatalog.data?.find((item) => item.id === id);
    return amenity ? amenityLabel(amenity, locale) : id;
  });
  const surface = court.surface ?? "unspecified";
  const description = localizedText(locale, court.description_vi, court.description_en);
  const empty = t("emptyValue");

  const [editOpen, setEditOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  return (
    <div className="flex w-full flex-col gap-3 px-0 pb-4 pt-0 md:gap-5 md:px-5 md:pb-6 md:pt-4">
      <CourtDetailHero
        onEdit={() => setEditOpen(true)}
        onDuplicate={() => setDuplicateOpen(true)}
        onStatus={() => setStatusOpen(true)}
      />

      <EntityDetailPanel
        title={t("sectionIdentity")}
        hint={t("hints.identity")}
        icon={<LayoutGrid className="size-4" />}
        tone="sky"
        className={softDetailPanelPad}
      >
        <ProfileRow label={t("fieldCode")} value={court.code} />
        <ProfileRow
          label={t("fieldBranch")}
          value={
            branch ? (
              <EntityRelationLink href={`/branches/${branch.id}`}>{branch.name}</EntityRelationLink>
            ) : (
              court.branch_id
            )
          }
        />
        <ProfileRow
          label={t("fieldEnvironment")}
          value={
            <span className="inline-flex items-center gap-1.5">
              {env === "indoor" ? (
                <Home className="size-3.5" aria-hidden />
              ) : env === "outdoor" ? (
                <Sun className="size-3.5" aria-hidden />
              ) : null}
              {t(`environment.${env}`)}
            </span>
          }
        />
        <ProfileRow label={t("fieldSport")} value={sport ? sportLabel(sport, locale) : empty} />
        <ProfileRow label={t("fieldSurface")} value={t(`surface.${surface}`)} />
        <ProfileRow label={t("fieldDimensions")} value={court.dimensions || empty} />
        <ProfileRow label={t("fieldBookable")} value={court.is_bookable ? t("bookableYes") : t("bookableNo")} />
      </EntityDetailPanel>

      <div className="grid grid-cols-1 items-stretch gap-3 md:gap-5 lg:grid-cols-2">
        <EntityDetailPanel
          title={t("sectionDescription")}
          hint={t("hints.description")}
          icon={<FileText className="size-4" aria-hidden />}
          tone="amber"
          className={cn("h-full", softDetailPanelPad)}
        >
          {description ? (
            <RichTextView html={description} />
          ) : (
            <p className="text-sm text-muted-foreground">{empty}</p>
          )}
        </EntityDetailPanel>

        <EntityDetailPanel
          title={t("fieldAmenities")}
          hint={t("hints.amenities")}
          icon={<Sparkles className="size-4" aria-hidden />}
          tone="rose"
          className={cn("h-full", softDetailPanelPad)}
        >
          {amenityNames.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {amenityNames.map((name) => (
                <SoftChip key={name} label={name} tone="sky" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{empty}</p>
          )}
        </EntityDetailPanel>
      </div>

      <CourtGalleryStrip organizationId={organizationId} courtId={courtId} />

      <CourtFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        organizationId={organizationId}
        mode="edit"
        court={court}
      />

      <CourtFormSheet
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
        organizationId={organizationId}
        mode="duplicate"
        court={court}
      />

      <CourtStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        organizationId={organizationId}
        court={court}
      />
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/40 py-1.5 last:border-0">
      <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 text-sm text-foreground">{value}</span>
    </div>
  );
}
