"use client";

import { cn } from "@bokdy/ui";
import type { ReactNode } from "react";

export type SoftIconTone = {
  backgroundColor: string;
  color: string;
};

/** Soft pastel icon chip palettes — match Soft UI reference. */
export const SOFT_ICON_TONES = {
  sky: { backgroundColor: "#E8EDF9", color: "#5B78BB" },
  amber: { backgroundColor: "#F9F1E8", color: "#B1906C" },
  emerald: { backgroundColor: "#E8F4F1", color: "#73A596" },
  rose: { backgroundColor: "#F9E8E8", color: "#BB7878" },
} as const satisfies Record<string, SoftIconTone>;

export type SoftIconToneKey = keyof typeof SOFT_ICON_TONES;

type SoftIconChipProps = {
  icon: ReactNode;
  /** Named Soft pastel tone. Overridden by color / backgroundColor. */
  tone?: SoftIconToneKey;
  /** Icon stroke / glyph color (CSS color). */
  color?: string;
  /** Chip fill (CSS color). */
  backgroundColor?: string;
  className?: string;
};

/** Soft UI icon square — reusable on KPI cards and block titles. */
export function SoftIconChip({
  icon,
  tone = "sky",
  color,
  backgroundColor,
  className,
}: SoftIconChipProps) {
  const preset = SOFT_ICON_TONES[tone];

  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        className,
      )}
      style={{
        color: color ?? preset.color,
        backgroundColor: backgroundColor ?? preset.backgroundColor,
      }}
    >
      {icon}
    </span>
  );
}
