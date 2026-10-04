"use client";

import { cn } from "@bokdy/ui";
import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  z: number;
  pz: number;
};

export type StarSurgeProps = {
  /** Star / streak color — hex or CSS var (e.g. `var(--shell-accent)`). */
  color?: string;
  /** Canvas fill behind the effect. */
  background?: string;
  /** Animation speed multiplier. */
  speed?: number;
  className?: string;
};

function resolveCssColor(value: string, el: HTMLElement): string {
  if (!value.startsWith("var(")) return value;
  const probe = document.createElement("span");
  probe.style.color = value;
  probe.style.display = "none";
  el.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved || value;
}

/** Relative luminance 0–1 from rgb()/rgba()/hex; defaults mid-gray on parse failure. */
function relativeLuminance(cssColor: string): number {
  let r = 128;
  let g = 128;
  let b = 128;

  const rgb = cssColor.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i,
  );
  if (rgb) {
    r = Number(rgb[1]);
    g = Number(rgb[2]);
    b = Number(rgb[3]);
  } else {
    const hex = cssColor.trim().replace("#", "");
    if (/^[0-9a-f]{6}$/i.test(hex)) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else if (/^[0-9a-f]{3}$/i.test(hex)) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    }
  }

  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Star Surge — canvas starfield surging from center (getdesign-compatible API).
 * Re-resolves CSS vars when html theme class or prefers-color-scheme changes.
 */
export function StarSurge({
  color = "var(--shell-accent)",
  background = "var(--shell-bg)",
  speed = 1,
  className,
}: StarSurgeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement ?? canvas;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const colorSchemeMq = window.matchMedia("(prefers-color-scheme: dark)");

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let stars: Star[] = [];
    let starColor = color;
    let bgColor = background;
    let alphaScale = 0.42;

    const STAR_COUNT = reduceMotion ? 48 : 140;

    function refreshColors() {
      starColor = resolveCssColor(color, parent);
      bgColor = resolveCssColor(background, parent);
      // Light sky paper needs readable streaks; dark navy can take stronger ones
      alphaScale = relativeLuminance(bgColor) > 0.4 ? 0.42 : 0.9;
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas!.width = Math.max(1, Math.floor(width * dpr));
      canvas!.height = Math.max(1, Math.floor(height * dpr));
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      refreshColors();
      seed();
    }

    function seed() {
      const depth = Math.max(width, height);
      stars = Array.from({ length: STAR_COUNT }, () => {
        const z = Math.random() * depth + 1;
        return {
          x: (Math.random() - 0.5) * width,
          y: (Math.random() - 0.5) * height,
          z,
          pz: z,
        };
      });
    }

    function resetStar(star: Star) {
      star.x = (Math.random() - 0.5) * width;
      star.y = (Math.random() - 0.5) * height;
      star.z = Math.max(width, height);
      star.pz = star.z;
    }

    function drawFrame() {
      ctx!.fillStyle = bgColor;
      ctx!.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const maxZ = Math.max(width, height);
      const surge = 2.4 * speed;

      ctx!.strokeStyle = starColor;
      ctx!.fillStyle = starColor;
      ctx!.lineCap = "round";

      for (const star of stars) {
        if (!reduceMotion) {
          star.pz = star.z;
          star.z -= surge;
          if (star.z <= 1) resetStar(star);
        }

        const k = 128 / star.z;
        const sx = cx + star.x * k;
        const sy = cy + star.y * k;
        if (sx < 0 || sx > width || sy < 0 || sy > height) {
          if (!reduceMotion) resetStar(star);
          continue;
        }

        const r = Math.max(0.4, (1 - star.z / maxZ) * 1.8);
        const alpha = Math.min(1, (1 - star.z / maxZ) * alphaScale);

        if (!reduceMotion) {
          const pk = 128 / star.pz;
          const px = cx + star.x * pk;
          const py = cy + star.y * pk;
          ctx!.globalAlpha = alpha * 0.7;
          ctx!.lineWidth = r;
          ctx!.beginPath();
          ctx!.moveTo(px, py);
          ctx!.lineTo(sx, sy);
          ctx!.stroke();
        }

        ctx!.globalAlpha = alpha;
        ctx!.beginPath();
        ctx!.arc(sx, sy, r, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
    }

    function loop() {
      drawFrame();
      if (!reduceMotion) raf = window.requestAnimationFrame(loop);
    }

    function onThemeChange() {
      refreshColors();
      drawFrame();
    }

    const ro = new ResizeObserver(() => {
      resize();
      drawFrame();
    });
    ro.observe(parent);

    const mo = new MutationObserver(onThemeChange);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    colorSchemeMq.addEventListener("change", onThemeChange);

    resize();
    if (reduceMotion) {
      drawFrame();
    } else {
      raf = window.requestAnimationFrame(loop);
    }

    return () => {
      ro.disconnect();
      mo.disconnect();
      colorSchemeMq.removeEventListener("change", onThemeChange);
      window.cancelAnimationFrame(raf);
    };
  }, [color, background, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("h-full w-full", className)}
      aria-hidden
    />
  );
}
