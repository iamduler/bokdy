"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bokdy/ui";
import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

type ImageCropDialogProps = {
  open: boolean;
  title: string;
  imageSrc: string | null;
  aspect: number;
  outputWidth: number;
  outputHeight: number;
  zoomLabel: string;
  cancelLabel: string;
  applyLabel: string;
  onOpenChange: (open: boolean) => void;
  onCropped: (file: Blob) => void;
};

export function ImageCropDialog({
  open,
  title,
  imageSrc,
  aspect,
  outputWidth,
  outputHeight,
  zoomLabel,
  cancelLabel,
  applyLabel,
  onOpenChange,
  onCropped,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [pending, setPending] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  async function apply() {
    if (!imageSrc || !area) return;
    setPending(true);
    try {
      const blob = await cropToJpeg(imageSrc, area, outputWidth, outputHeight);
      onCropped(blob);
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setZoom(1);
          setCrop({ x: 0, y: 0 });
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative h-72 w-full overflow-hidden rounded-lg bg-muted">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          ) : null}
        </div>
        <label className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{zoomLabel}</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full"
          />
        </label>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button type="button" size="sm" onClick={apply} disabled={pending || !area}>
            {applyLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image"));
    image.src = src;
  });
}

async function cropToJpeg(src: string, area: Area, width: number, height: number): Promise<Blob> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.9);
  });
  if (!blob) throw new Error("blob");
  return blob;
}
