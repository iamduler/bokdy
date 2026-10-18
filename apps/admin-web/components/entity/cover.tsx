"use client";

import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bokdy/ui";
import { Camera, Eye } from "lucide-react";
import { useRef, useState } from "react";

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
        <span className="flex aspect-[3/1] items-center justify-center overflow-hidden rounded-lg border border-dashed border-primary bg-muted text-sm text-muted-foreground">
          {bannerPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerPreview} alt="" className="h-full w-full object-cover" />
          ) : (
            bannerLabel
          )}
        </span>
        <MediaActions
          className="absolute right-3 bottom-3"
          preview={bannerPreview}
          label={bannerLabel}
          viewLabel={viewLabel}
          pickLabel={pickLabel}
          onPick={onBanner}
          onView={() => bannerPreview && setViewing({ src: bannerPreview, label: bannerLabel })}
        />
      </div>
      <div className="absolute -bottom-12 left-4 md:-bottom-14 md:left-6">
        <LogoControl
          label={logoLabel}
          preview={logoPreview}
          viewLabel={viewAvatarLabel}
          changeLabel={changeImageLabel}
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

function LogoControl({
  label,
  preview,
  viewLabel,
  changeLabel,
  onPick,
  onView,
}: {
  label: string;
  preview: string | null;
  viewLabel: string;
  changeLabel: string;
  onPick: (file: File) => void;
  onView: () => void;
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
  const face = preview ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={preview} alt="" className="h-full w-full object-cover" />
  ) : (
    label
  );

  if (!preview) {
    return (
      <>
        <button type="button" className={logoClass} aria-label={changeLabel} onClick={() => inputRef.current?.click()}>
          {face}
        </button>
        {fileInput}
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={logoClass} aria-label={label}>
            {face}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={onView}>{viewLabel}</DropdownMenuItem>
          <DropdownMenuItem
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

function MediaActions({
  className,
  preview,
  label,
  viewLabel,
  pickLabel,
  onPick,
  onView,
}: {
  className?: string;
  preview: string | null;
  label: string;
  viewLabel: string;
  pickLabel: string;
  onPick: (file: File) => void;
  onView: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("flex gap-1", className)}>
      {preview ? (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="border-0 bg-background text-primary shadow-none"
          aria-label={`${viewLabel} ${label}`}
          onClick={onView}
        >
          <Eye />
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="border-0 bg-background text-primary shadow-none"
        aria-label={`${pickLabel} ${label}`}
        onClick={() => inputRef.current?.click()}
      >
        <Camera />
      </Button>
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
    </div>
  );
}
