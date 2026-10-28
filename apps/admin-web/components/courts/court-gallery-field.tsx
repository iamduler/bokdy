"use client";

import { Button, Input, toast } from "@bokdy/ui";
import { Play, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import {
  MediaLightbox,
  type MediaPreviewItem,
} from "@/components/entity/media-lightbox";
import { useCourtGallery } from "@/hooks/use-courts";
import { courtGalleryFileSrc } from "@/lib/api/courts";
import {
  isAllowedGalleryMime,
  mediaKindFromFile,
  mediaKindFromMime,
} from "@/lib/media-kind";

export const COURT_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,video/mp4,video/webm";
const ACCEPT_TYPES = COURT_IMAGE_ACCEPT.split(",");

/** Keep only supported media files; reports unsupported ones via `onInvalid`. */
export function filterCourtImages(files: FileList | null, onInvalid: () => void): File[] {
  const picked = Array.from(files ?? []);
  const valid = picked.filter(
    (file) => ACCEPT_TYPES.includes(file.type) || isAllowedGalleryMime(file.type),
  );
  if (valid.length !== picked.length) onInvalid();
  return valid;
}

type PendingProps = {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
};

/** Create mode: files are queued locally and uploaded after the court exists. */
export function CourtPendingImages({ files, onChange, disabled }: PendingProps) {
  const t = useTranslations("organization.court.images");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const previews = useMemo(
    () =>
      files.map((file, index) => ({
        file,
        url: URL.createObjectURL(file),
        item: {
          id: `pending-${index}-${file.name}`,
          src: "",
          kind: mediaKindFromFile(file),
          alt: file.name,
        } satisfies MediaPreviewItem,
      })),
    [files],
  );
  useEffect(
    () => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [previews],
  );

  const playlist = useMemo<MediaPreviewItem[]>(
    () =>
      previews.map((preview) => ({
        ...preview.item,
        src: preview.url,
      })),
    [previews],
  );

  return (
    <div className="space-y-3">
      <Input
        type="file"
        multiple
        accept={COURT_IMAGE_ACCEPT}
        disabled={disabled}
        aria-label={t("upload")}
        onChange={(event) => {
          const added = filterCourtImages(event.target.files, () =>
            toast.error(t("invalidType")),
          );
          if (added.length) onChange([...files, ...added]);
          event.target.value = "";
        }}
      />
      {previews.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("pendingHint")}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {previews.map((preview, index) => (
            <li
              key={`${preview.file.name}-${index}`}
              className="relative overflow-hidden rounded-lg ring-1 ring-black/5"
            >
              <button
                type="button"
                className="block w-full cursor-pointer"
                aria-label={t("preview")}
                onClick={() => setPreviewIndex(index)}
              >
                <GalleryThumb
                  kind={preview.item.kind}
                  src={preview.url}
                  alt={preview.file.name}
                />
              </button>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="absolute top-1 right-1 border-0 bg-background text-destructive shadow-none"
                aria-label={t("remove")}
                title={t("remove")}
                disabled={disabled}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
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
    </div>
  );
}

type DraftProps = {
  organizationId: string;
  courtId: string;
  pendingFiles: File[];
  onPendingFilesChange: (files: File[]) => void;
  removedIds: string[];
  onRemovedIdsChange: (ids: string[]) => void;
  disabled?: boolean;
};

/**
 * Edit mode: draft gallery locally. Removals and new files commit only on form save.
 */
export function CourtGalleryManager({
  organizationId,
  courtId,
  pendingFiles,
  onPendingFilesChange,
  removedIds,
  onRemovedIdsChange,
  disabled,
}: DraftProps) {
  const t = useTranslations("organization.court.images");
  const gallery = useCourtGallery(organizationId, courtId);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const removedSet = useMemo(() => new Set(removedIds), [removedIds]);

  const savedItems = [...(gallery.data ?? [])]
    .filter((item) => !removedSet.has(item.id))
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);

  const pendingPreviews = useMemo(
    () =>
      pendingFiles.map((file, index) => ({
        file,
        url: URL.createObjectURL(file),
        id: `pending-${index}-${file.name}`,
        kind: mediaKindFromFile(file),
      })),
    [pendingFiles],
  );
  useEffect(
    () => () => pendingPreviews.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [pendingPreviews],
  );

  const playlist = useMemo<MediaPreviewItem[]>(() => {
    const saved: MediaPreviewItem[] = savedItems.map((item) => ({
      id: item.id,
      src: courtGalleryFileSrc(item),
      kind: mediaKindFromMime(item.mime_type),
      alt: item.caption_vi || item.caption_en || "",
    }));
    const pending: MediaPreviewItem[] = pendingPreviews.map((preview) => ({
      id: preview.id,
      src: preview.url,
      kind: preview.kind,
      alt: preview.file.name,
    }));
    return [...saved, ...pending];
  }, [savedItems, pendingPreviews]);

  const empty =
    !gallery.isLoading &&
    !gallery.isError &&
    savedItems.length === 0 &&
    pendingPreviews.length === 0;

  return (
    <div className="space-y-3">
      <Input
        type="file"
        multiple
        accept={COURT_IMAGE_ACCEPT}
        disabled={disabled}
        aria-label={t("upload")}
        onChange={(event) => {
          const added = filterCourtImages(event.target.files, () =>
            toast.error(t("invalidType")),
          );
          if (added.length) onPendingFilesChange([...pendingFiles, ...added]);
          event.target.value = "";
        }}
      />
      <p className="text-xs text-muted-foreground">{t("editDraftHint")}</p>
      {gallery.isLoading ? (
        <p className="text-xs text-muted-foreground">{t("loading")}</p>
      ) : gallery.isError ? (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <span>{t("loadError")}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={gallery.isFetching}
            onClick={() => void gallery.refetch()}
          >
            {t("retry")}
          </Button>
        </div>
      ) : empty ? (
        <p className="text-xs text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {savedItems.map((item, index) => (
            <li
              key={item.id}
              className="relative overflow-hidden rounded-lg ring-1 ring-black/5"
            >
              <button
                type="button"
                className="block w-full cursor-pointer"
                aria-label={t("preview")}
                onClick={() => setPreviewIndex(index)}
              >
                <GalleryThumb
                  kind={mediaKindFromMime(item.mime_type)}
                  src={courtGalleryFileSrc(item)}
                  alt={item.caption_vi || item.caption_en || ""}
                />
              </button>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="absolute top-1 right-1 border-0 bg-background text-destructive shadow-none"
                aria-label={t("remove")}
                title={t("remove")}
                disabled={disabled}
                onClick={() => onRemovedIdsChange([...removedIds, item.id])}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
          {pendingPreviews.map((preview, index) => (
            <li
              key={preview.id}
              className="relative overflow-hidden rounded-lg ring-1 ring-black/5"
            >
              <button
                type="button"
                className="block w-full cursor-pointer"
                aria-label={t("preview")}
                onClick={() => setPreviewIndex(savedItems.length + index)}
              >
                <GalleryThumb
                  kind={preview.kind}
                  src={preview.url}
                  alt={preview.file.name}
                />
              </button>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="absolute top-1 right-1 border-0 bg-background text-destructive shadow-none"
                aria-label={t("remove")}
                title={t("remove")}
                disabled={disabled}
                onClick={() =>
                  onPendingFilesChange(pendingFiles.filter((_, i) => i !== index))
                }
              >
                <Trash2 />
              </Button>
            </li>
          ))}
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
    </div>
  );
}

function GalleryThumb({
  kind,
  src,
  alt,
}: {
  kind: "image" | "video";
  src: string;
  alt: string;
}) {
  if (kind === "video") {
    return (
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
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="aspect-4/3 w-full object-cover" loading="lazy" />
  );
}
