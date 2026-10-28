"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  cn,
} from "@bokdy/ui";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import type { MediaKind } from "@/lib/media-kind";

export type MediaPreviewItem = {
  id: string;
  src: string;
  kind: MediaKind;
  alt?: string;
  poster?: string;
};

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

type MediaLightboxProps = {
  items: MediaPreviewItem[];
  /** null = closed */
  index: number | null;
  onIndexChange: (index: number | null) => void;
  closeLabel: string;
  previousLabel: string;
  nextLabel: string;
  titleLabel: string;
  zoomInLabel: string;
  zoomOutLabel: string;
};

export function MediaLightbox({
  items,
  index,
  onIndexChange,
  closeLabel,
  previousLabel,
  nextLabel,
  titleLabel,
  zoomInLabel,
  zoomOutLabel,
}: MediaLightboxProps) {
  const open = index !== null && items.length > 0;
  const current = open && index !== null ? items[index] : undefined;
  const canPrev = open && index !== null && index > 0;
  const canNext = open && index !== null && index < items.length - 1;
  const stripRef = useRef<HTMLUListElement>(null);
  const imageStageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open || index === null) return;
    if (index < 0 || index >= items.length) {
      onIndexChange(null);
    }
  }, [open, index, items.length, onIndexChange]);

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    dragRef.current = null;
    setDragging(false);
  }, [index, current?.id]);

  useEffect(() => {
    if (zoom <= 1) setOffset({ x: 0, y: 0 });
  }, [zoom]);

  useEffect(() => {
    if (!open || index === null || !stripRef.current) return;
    const thumb = stripRef.current.querySelector<HTMLElement>(
      `[data-thumb-index="${index}"]`,
    );
    thumb?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [open, index]);

  useEffect(() => {
    const stage = imageStageRef.current;
    if (!stage || current?.kind !== "image") return;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      event.stopPropagation();
      const direction = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((currentZoom) =>
        Math.min(
          ZOOM_MAX,
          Math.max(ZOOM_MIN, Math.round((currentZoom + direction) * 100) / 100),
        ),
      );
    }
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [current?.kind, current?.id]);

  function clampZoom(value: number) {
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100));
  }

  function adjustZoom(delta: number) {
    setZoom((currentZoom) => clampZoom(currentZoom + delta));
  }

  function go(delta: number) {
    if (index === null) return;
    const next = index + delta;
    if (next < 0 || next >= items.length) return;
    onIndexChange(next);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    } else if (event.key === "+" || event.key === "=") {
      if (current?.kind === "image") {
        event.preventDefault();
        adjustZoom(ZOOM_STEP);
      }
    } else if (event.key === "-" || event.key === "_") {
      if (current?.kind === "image") {
        event.preventDefault();
        adjustZoom(-ZOOM_STEP);
      }
    }
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (current?.kind !== "image" || zoom <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    setDragging(true);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setOffset({
      x: drag.originX + (event.clientX - drag.startX),
      y: drag.originY + (event.clientY - drag.startY),
    });
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onIndexChange(null);
      }}
    >
      <DialogContent
        className="flex max-h-[95vh] w-[min(96vw,72rem)] max-w-none flex-col gap-3 border-0 bg-background/95 p-3 sm:p-4"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center justify-between gap-2 pr-8">
          <DialogTitle className="truncate text-sm font-medium">
            {titleLabel}
            {open && index !== null ? (
              <span className="ml-2 text-muted-foreground">
                {index + 1}/{items.length}
              </span>
            ) : null}
          </DialogTitle>
          <DialogDescription className="sr-only">{titleLabel}</DialogDescription>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
          {current?.kind === "image" ? (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label={zoomOutLabel}
                disabled={zoom <= ZOOM_MIN}
                onClick={() => adjustZoom(-ZOOM_STEP)}
              >
                <ZoomOut className="size-4" aria-hidden />
              </Button>
              <span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label={zoomInLabel}
                disabled={zoom >= ZOOM_MAX}
                onClick={() => adjustZoom(ZOOM_STEP)}
              >
                <ZoomIn className="size-4" aria-hidden />
              </Button>
            </div>
          ) : null}

          <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="absolute left-0 z-10 hidden sm:inline-flex"
              disabled={!canPrev}
              aria-label={previousLabel}
              onClick={() => go(-1)}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </Button>

            {current ? (
              current.kind === "video" ? (
                <video
                  key={current.id}
                  src={current.src}
                  poster={current.poster}
                  controls
                  playsInline
                  preload="metadata"
                  className="max-h-[min(60vh,36rem)] max-w-full rounded-lg bg-black"
                >
                  {current.alt}
                </video>
              ) : (
                <div
                  ref={imageStageRef}
                  className={cn(
                    "relative flex h-[min(60vh,36rem)] w-full max-w-full items-center justify-center overflow-hidden rounded-lg",
                    zoom > 1
                      ? dragging
                        ? "cursor-grabbing"
                        : "cursor-grab"
                      : "cursor-default",
                  )}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={current.id}
                    src={current.src}
                    alt={current.alt ?? ""}
                    className="max-h-full max-w-full select-none object-contain will-change-transform"
                    style={{
                      transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
                      transformOrigin: "center center",
                      transition: dragging ? "none" : "transform 80ms ease-out",
                    }}
                    draggable={false}
                  />
                </div>
              )
            ) : null}

            <Button
              type="button"
              size="icon"
              variant="outline"
              className="absolute right-0 z-10 hidden sm:inline-flex"
              disabled={!canNext}
              aria-label={nextLabel}
              onClick={() => go(1)}
            >
              <ChevronRight className="size-5" aria-hidden />
            </Button>
          </div>
        </div>

        {items.length > 1 ? (
          <div className="overflow-x-auto pb-1 soft-scrollbar">
            <ul
              ref={stripRef}
              className="mx-auto flex w-max gap-2"
              role="listbox"
              aria-label={titleLabel}
            >
              {items.map((item, i) => {
                const selected = i === index;
                return (
                  <li key={item.id} className="shrink-0">
                    <button
                      type="button"
                      data-thumb-index={i}
                      role="option"
                      aria-selected={selected}
                      aria-label={item.alt || `${titleLabel} ${i + 1}`}
                      className={cn(
                        "relative block size-16 overflow-hidden rounded-md ring-1 transition-[ring,opacity] sm:size-20",
                        selected
                          ? "ring-2 ring-sky-500 opacity-100"
                          : "ring-black/10 opacity-70 hover:opacity-100",
                      )}
                      onClick={() => onIndexChange(i)}
                    >
                      {item.kind === "video" ? (
                        <>
                          <video
                            src={item.src}
                            poster={item.poster}
                            muted
                            playsInline
                            preload="metadata"
                            className="size-full object-cover"
                          />
                          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="size-4 text-white" aria-hidden />
                          </span>
                        </>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.src}
                          alt=""
                          className="size-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 sm:hidden">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canPrev}
            onClick={() => go(-1)}
          >
            <ChevronLeft className="size-4" aria-hidden />
            {previousLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canNext}
            onClick={() => go(1)}
          >
            {nextLabel}
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
        <span className="sr-only">{closeLabel}</span>
      </DialogContent>
    </Dialog>
  );
}
