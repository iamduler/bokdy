"use client";

import { Button, Input, toast } from "@bokdy/ui";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";

import { useCourtGallery } from "@/hooks/use-courts";
import { courtGalleryFileSrc } from "@/lib/api/courts";

export const COURT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
const ACCEPT_TYPES = COURT_IMAGE_ACCEPT.split(",");

/** Keep only supported image files; reports unsupported ones via `onInvalid`. */
export function filterCourtImages(files: FileList | null, onInvalid: () => void): File[] {
  const picked = Array.from(files ?? []);
  const valid = picked.filter((file) => ACCEPT_TYPES.includes(file.type));
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
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );
  useEffect(
    () => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)),
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url}
                alt={preview.file.name}
                className="aspect-4/3 w-full object-cover"
              />
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
  const removedSet = useMemo(() => new Set(removedIds), [removedIds]);

  const savedItems = [...(gallery.data ?? [])]
    .filter((item) => !removedSet.has(item.id))
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);

  const pendingPreviews = useMemo(
    () => pendingFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [pendingFiles],
  );
  useEffect(
    () => () => pendingPreviews.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [pendingPreviews],
  );

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
          {savedItems.map((item) => (
            <li
              key={item.id}
              className="relative overflow-hidden rounded-lg ring-1 ring-black/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={courtGalleryFileSrc(item)}
                alt={item.caption_vi || item.caption_en || ""}
                className="aspect-4/3 w-full object-cover"
                loading="lazy"
              />
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
              key={`pending-${preview.file.name}-${index}`}
              className="relative overflow-hidden rounded-lg ring-1 ring-black/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url}
                alt={preview.file.name}
                className="aspect-4/3 w-full object-cover"
              />
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
    </div>
  );
}
