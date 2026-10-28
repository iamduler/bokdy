"use client";

import { Images, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { DataListEmpty } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import {
  MediaLightbox,
  type MediaPreviewItem,
} from "@/components/entity/media-lightbox";
import { useCourtGallery } from "@/hooks/use-courts";
import { courtGalleryFileSrc } from "@/lib/api/courts";
import { mediaKindFromMime } from "@/lib/media-kind";

type CourtGalleryStripProps = {
  organizationId: string;
  courtId: string;
};

/** Read-only gallery for the court overview (manage media from the edit form). */
export function CourtGalleryStrip({ organizationId, courtId }: CourtGalleryStripProps) {
  const t = useTranslations("organization.court.images");
  const gallery = useCourtGallery(organizationId, courtId);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const items = useMemo(
    () =>
      [...(gallery.data ?? [])].sort(
        (a, b) =>
          Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order,
      ),
    [gallery.data],
  );

  const playlist = useMemo<MediaPreviewItem[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        src: courtGalleryFileSrc(item),
        kind: mediaKindFromMime(item.mime_type),
        alt: item.caption_vi || item.caption_en || "",
      })),
    [items],
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
          {items.map((item, index) => {
            const kind = mediaKindFromMime(item.mime_type);
            const src = courtGalleryFileSrc(item);
            const alt = item.caption_vi || item.caption_en || "";
            return (
              <li key={item.id} className="w-40 shrink-0">
                <button
                  type="button"
                  className="block w-full cursor-pointer overflow-hidden rounded-xl ring-1 ring-black/5"
                  aria-label={t("preview")}
                  onClick={() => setPreviewIndex(index)}
                >
                  {kind === "video" ? (
                    <span className="relative block aspect-4/3 w-full bg-muted">
                      <video
                        src={src}
                        muted
                        playsInline
                        preload="metadata"
                        className="aspect-4/3 w-full object-cover"
                      />
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                        <Play className="size-6 text-white" aria-hidden />
                      </span>
                    </span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={alt}
                      className="aspect-4/3 w-full object-cover"
                      loading="lazy"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <MediaLightbox
        items={playlist}
        index={previewIndex}
        onIndexChange={setPreviewIndex}
        closeLabel={t("closePreview")}
        previousLabel={t("previous")}
        nextLabel={t("next")}
        titleLabel={t("preview")}
        zoomInLabel={t("zoomIn")}
        zoomOutLabel={t("zoomOut")}
      />
    </EntityDetailPanel>
  );
}
