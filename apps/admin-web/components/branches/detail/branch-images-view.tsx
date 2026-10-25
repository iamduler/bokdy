"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
  toast,
} from "@bokdy/ui";
import { ImagePlus, Images, Star, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";

import {
  DataListEmpty,
  softDirectoryPrimaryBtn,
  softDirectorySecondaryBtn,
} from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import {
  useBranchGallery,
  useDeleteBranchGalleryItem,
  useUpdateBranchGalleryItem,
  useUploadBranchGalleryImage,
} from "@/hooks/use-branch-gallery";
import { branchGalleryFileSrc, type BranchGalleryItem } from "@/lib/api/branch-gallery";
import { ApiError, errorMessageKey } from "@/lib/api/errors";

import { useBranchDetail } from "./branch-detail-context";
import { BranchTabBody, BranchTabError, BranchTabLoading } from "./branch-tab-state";

const ACCEPT = "image/jpeg,image/png,image/webp";
const ACCEPT_TYPES = ACCEPT.split(",");

function captionOf(item: BranchGalleryItem, locale: string) {
  const primary = locale.startsWith("vi") ? item.caption_vi : item.caption_en;
  const fallback = locale.startsWith("vi") ? item.caption_en : item.caption_vi;
  return primary?.trim() || fallback?.trim() || "";
}

export function BranchImagesView() {
  const t = useTranslations("organization.branchDetail.images");
  const te = useTranslations("errors");
  const locale = useLocale();
  const { organizationId, branchId } = useBranchDetail();
  const inputRef = useRef<HTMLInputElement>(null);
  const gallery = useBranchGallery(organizationId, branchId);
  const upload = useUploadBranchGalleryImage(organizationId, branchId);
  const update = useUpdateBranchGalleryItem(organizationId, branchId);
  const remove = useDeleteBranchGalleryItem(organizationId, branchId);
  const [pendingDelete, setPendingDelete] = useState<BranchGalleryItem | null>(null);
  const busy = upload.isPending || update.isPending || remove.isPending;

  function fail(err: unknown) {
    toast.error(err instanceof ApiError ? te(errorMessageKey(err)) : t("actionError"));
  }

  async function onFiles(files: FileList | null) {
    const picked = Array.from(files ?? []);
    for (const file of picked) {
      if (!ACCEPT_TYPES.includes(file.type)) {
        toast.error(t("invalidType"));
        continue;
      }
      try {
        await upload.mutateAsync(file);
        toast.success(t("uploaded"));
      } catch (err) {
        fail(err);
      }
    }
  }

  const items = [...(gallery.data ?? [])].sort(
    (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order,
  );

  return (
    <BranchTabBody>
      <EntityDetailPanel
        title={t("title")}
        icon={<Images className="size-4" aria-hidden />}
        tone="amber"
        actions={
          <>
            <Button
              type="button"
              size="lg"
              className={softDirectoryPrimaryBtn}
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="size-4" aria-hidden />
              {upload.isPending ? t("uploading") : t("upload")}
            </Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="sr-only"
              tabIndex={-1}
              aria-label={t("upload")}
              onChange={(event) => {
                const files = event.target.files;
                void onFiles(files).finally(() => {
                  event.target.value = "";
                });
              }}
            />
          </>
        }
      >
        {gallery.isLoading ? (
          <BranchTabLoading />
        ) : gallery.isError ? (
          <BranchTabError
            message={t("loadError")}
            onRetry={() => void gallery.refetch()}
            retryDisabled={gallery.isFetching}
          />
        ) : items.length === 0 ? (
          <DataListEmpty title={t("empty")} description={t("emptyHint")} className="py-10" />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => {
              const caption = captionOf(item, locale);
              return (
                <li
                  key={item.id}
                  className="group relative overflow-hidden rounded-xl ring-1 ring-black/5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={branchGalleryFileSrc(item)}
                    alt={caption}
                    className="aspect-4/3 w-full object-cover"
                    loading="lazy"
                  />
                  {item.is_cover ? (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      <Star className="size-3" aria-hidden />
                      {t("cover")}
                    </span>
                  ) : null}
                  <div
                    className={cn(
                      "absolute top-2 right-2 flex gap-1",
                      "opacity-100 sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100",
                    )}
                  >
                    {!item.is_cover ? (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        className="border-0 bg-background text-primary shadow-none"
                        aria-label={t("setCover")}
                        title={t("setCover")}
                        disabled={busy}
                        onClick={() =>
                          update.mutate(
                            { mediaId: item.id, patch: { is_cover: true } },
                            { onSuccess: () => toast.success(t("coverSet")), onError: fail },
                          )
                        }
                      >
                        <Star />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      className="border-0 bg-background text-destructive shadow-none"
                      aria-label={t("delete")}
                      title={t("delete")}
                      disabled={busy}
                      onClick={() => setPendingDelete(item)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  {caption ? (
                    <p className="truncate bg-card px-3 py-2 text-xs text-muted-foreground">
                      {caption}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </EntityDetailPanel>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>{t("deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              size="lg"
              className={softDirectorySecondaryBtn}
              onClick={() => setPendingDelete(null)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                if (!pendingDelete) return;
                remove.mutate(pendingDelete.id, {
                  onSuccess: () => toast.success(t("deleted")),
                  onError: fail,
                  onSettled: () => setPendingDelete(null),
                });
              }}
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BranchTabBody>
  );
}
