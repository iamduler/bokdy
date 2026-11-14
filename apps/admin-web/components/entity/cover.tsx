"use client";

import {
  cn,
  Dialog,
  DialogContent,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bokdy/ui";
import { useRef, useState, type ReactNode } from "react";

type EntityCoverProps = {
  bannerLabel: string;
  logoLabel: string;
  viewLabel: string;
  pickLabel: string;
  viewAvatarLabel: string;
  changeImageLabel: string;
  bannerPreview: string | null;
  logoPreview: string | null;
  onBanner: (file: File) => void;
  onLogo: (file: File) => void;
};

const logoClass =
  "flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-primary bg-muted text-xs text-muted-foreground md:size-28";

const bannerClass =
  "flex aspect-[3/1] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-primary bg-muted text-sm text-muted-foreground";

export function EntityCover({
  bannerLabel,
  logoLabel,
  viewLabel,
  pickLabel,
  viewAvatarLabel,
  changeImageLabel,
  bannerPreview,
  logoPreview,
  onBanner,
  onLogo,
}: EntityCoverProps) {
  const [viewing, setViewing] = useState<{ src: string; label: string } | null>(null);

  return (
    <div className="relative mb-16 md:mb-20">
      <div className="relative">
        <ImagePickControl
          className={bannerClass}
          label={bannerLabel}
          preview={bannerPreview}
          emptyLabel={bannerLabel}
          viewLabel={viewLabel}
          changeLabel={changeImageLabel}
          pickLabel={pickLabel}
          menuAlign="end"
          onPick={onBanner}
          onView={() => bannerPreview && setViewing({ src: bannerPreview, label: bannerLabel })}
        />
      </div>
      <div className="absolute -bottom-12 left-4 md:-bottom-14 md:left-6">
        <ImagePickControl
          className={logoClass}
          label={logoLabel}
          preview={logoPreview}
          emptyLabel={logoLabel}
          viewLabel={viewAvatarLabel}
          changeLabel={changeImageLabel}
          pickLabel={pickLabel}
          menuAlign="center"
          onPick={onLogo}
          onView={() => logoPreview && setViewing({ src: logoPreview, label: logoLabel })}
        />
      </div>
      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-3xl p-3">
          <DialogTitle className="sr-only">{viewing?.label}</DialogTitle>
          {viewing ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={viewing.src} alt={viewing.label} className="max-h-[70vh] w-full object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Shared click-to-pick / View+Change dropdown for Soft cover media. */
export function ImagePickControl({
  className,
  label,
  preview,
  emptyLabel,
  viewLabel,
  changeLabel,
  pickLabel,
  menuAlign = "center",
  onPick,
  onView,
  face,
}: {
  className?: string;
  label: string;
  preview: string | null;
  emptyLabel: ReactNode;
  viewLabel: string;
  changeLabel: string;
  pickLabel: string;
  /** Banner triggers are full-width — prefer `end`. Avatar prefers `center`. */
  menuAlign?: "start" | "center" | "end";
  onPick: (file: File) => void;
  onView: () => void;
  face?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="sr-only"
      onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) onPick(file);
      }}
    />
  );
  const content = face ??
    (preview ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={preview} alt="" className="h-full w-full object-cover" />
    ) : (
      emptyLabel
    ));

  if (!preview) {
    return (
      <>
        <button
          type="button"
          className={cn(className)}
          aria-label={pickLabel}
          onClick={() => inputRef.current?.click()}
        >
          {content}
        </button>
        {fileInput}
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={cn(className)} aria-label={label}>
            {content}
          </button>
        </DropdownMenuTrigger>
        {/* Override trigger-width binding on DropdownMenuContent (banner is full-bleed). */}
        <DropdownMenuContent
          align={menuAlign}
          sideOffset={8}
          className="w-auto min-w-44 max-w-56"
        >
          <DropdownMenuItem className="whitespace-nowrap" onSelect={onView}>
            {viewLabel}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="whitespace-nowrap"
            onSelect={() => {
              window.setTimeout(() => inputRef.current?.click(), 0);
            }}
          >
            {changeLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {fileInput}
    </>
  );
}
