"use client";

import { Images } from "lucide-react";
import { useTranslations } from "next-intl";

import { DataListEmpty } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { useCourtGallery } from "@/hooks/use-courts";
import { courtGalleryFileSrc } from "@/lib/api/courts";

type CourtGalleryStripProps = {
  organizationId: string;
  courtId: string;
};

/** Read-only gallery for the court overview (manage images from the edit form). */
export function CourtGalleryStrip({ organizationId, courtId }: CourtGalleryStripProps) {
  const t = useTranslations("organization.court.images");
  const gallery = useCourtGallery(organizationId, courtId);
  const items = [...(gallery.data ?? [])].sort(
    (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order,
  );

  return (
    <EntityDetailPanel
      title={t("title")}
      icon={<Images className="size-4" aria-hidden />}
      tone="amber"
    >
      {gallery.isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("loading")}</p>
      ) : gallery.isError ? (
        <p className="mt-3 text-sm text-destructive">{t("loadError")}</p>
      ) : items.length === 0 ? (
        <DataListEmpty title={t("empty")} className="py-8" />
      ) : (
        <ul className="mt-3 flex gap-3 overflow-x-auto pb-1 soft-scrollbar">
          {items.map((item) => (
            <li
              key={item.id}
              className="w-40 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={courtGalleryFileSrc(item)}
                alt={item.caption_vi || item.caption_en || ""}
                className="aspect-4/3 w-full object-cover"
                loading="lazy"
              />
            </li>
          ))}
        </ul>
      )}
    </EntityDetailPanel>
  );
}
