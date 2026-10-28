"use client";

import { RichTextView } from "@bokdy/ui";
import { Copy, Home, LayoutGrid, Pencil, RefreshCw, Sparkles, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import { sportLabel } from "@/components/branches/branch-sports-chips";
import { CourtFormSheet } from "@/components/courts/court-form-sheet";
import { CourtGalleryStrip } from "@/components/courts/court-gallery-strip";
import { COURT_STATUS_TONE } from "@/components/courts/court-status";
import { CourtStatusDialog } from "@/components/courts/court-status-dialog";
import { useCourtDetail } from "@/components/courts/detail/court-detail-context";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { EntitySplitButton } from "@/components/entity/split-button";
import { useAmenityCatalog } from "@/hooks/use-amenities";
import { useBranch } from "@/hooks/use-branches";
import { useSports } from "@/hooks/use-sports";
import { amenityLabel } from "@/lib/api/amenities";
import { Link } from "@/i18n/navigation";

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
  const description = locale.startsWith("vi")
    ? court.description_vi || court.description_en
    : court.description_en || court.description_vi;

  const [editOpen, setEditOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="min-w-0 truncate text-xl font-semibold text-foreground">
            {court.name}
          </h1>
          <span className="shrink-0">
            <SoftStatusChip
              label={t(`status.${court.status}`)}
              tone={COURT_STATUS_TONE[court.status]}
            />
          </span>
        </div>
        <EntitySplitButton
          label={t("editCourt")}
          icon={<Pencil className="size-3.5" aria-hidden />}
          onClick={() => setEditOpen(true)}
          disabled={court.status === "archived"}
          menuLabel={t("moreActions")}
          items={[
            {
              id: "duplicate",
              label: t("duplicate"),
              icon: <Copy className="size-3.5" aria-hidden />,
              onSelect: () => setDuplicateOpen(true),
            },
            {
              id: "update-status",
              label: t("updateStatus"),
              icon: <RefreshCw className="size-3.5" aria-hidden />,
              onSelect: () => setStatusOpen(true),
              disabled: court.status === "archived",
            },
          ]}
        />
      </div>

      <EntityDetailPanel title={t("sectionIdentity")} icon={<LayoutGrid className="size-4" />} tone="sky">
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ProfileRow label={t("fieldNameVi")} value={court.name_vi || t("emptyValue")} />
          <ProfileRow label={t("fieldNameEn")} value={court.name_en || t("emptyValue")} />
          <ProfileRow label={t("fieldCode")} value={court.code} />
          <ProfileRow label={t("fieldPublicId")} value={court.public_id} />
          <ProfileRow
            label={t("fieldBranch")}
            value={
              branch ? (
                <Link
                  href={`/branches/${branch.id}`}
                  className="text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
                >
                  {branch.name}
                </Link>
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
                ) : (
                  <Sun className="size-3.5" aria-hidden />
                )}
                {t(`environment.${env}`)}
              </span>
            }
          />
          <ProfileRow
            label={t("fieldSport")}
            value={sport ? sportLabel(sport, locale) : t("emptyValue")}
          />
          <ProfileRow label={t("fieldSurface")} value={t(`surface.${surface}`)} />
          <ProfileRow
            label={t("fieldDimensions")}
            value={court.dimensions || t("emptyValue")}
          />
          <ProfileRow
            label={t("fieldBookable")}
            value={court.is_bookable ? t("bookableYes") : t("bookableNo")}
          />
        </div>
      </EntityDetailPanel>

      <EntityDetailPanel
        title={t("sectionDescription")}
        icon={<Sparkles className="size-4" aria-hidden />}
        tone="rose"
      >
        <div className="mt-3 grid gap-3">
          <ProfileRow
            label={t("fieldDescription")}
            value={
              description ? (
                <RichTextView html={description} />
              ) : (
                t("emptyValue")
              )
            }
          />
          <ProfileRow
            label={t("fieldAmenities")}
            value={
              amenityNames.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {amenityNames.map((name) => (
                    <li
                      key={name}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              ) : (
                t("emptyValue")
              )
            }
          />
        </div>
      </EntityDetailPanel>

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
    <div className="min-w-0">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}
