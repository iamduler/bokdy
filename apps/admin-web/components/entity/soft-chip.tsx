import { cn } from "@bokdy/ui";

/**
 * Soft UI text-chip standard (admin Soft screens).
 *
 * Domain screens must not invent ad-hoc Badge / bg-*15 chip classes.
 * Map domain values → SoftChipToneKey, then render SoftChip (or SoftStatusChip).
 *
 * SoftIconChip is separate — icon glyphs only, not text labels.
 */
export type SoftChipTone = {
  chip: string;
  dot: string;
};

/** Shared Soft pastel palette — light: bg-*-50 + text-*-800 for contrast. */
export const SOFT_CHIP_TONES = {
  emerald: {
    chip: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  sky: {
    chip: "bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  rose: {
    chip: "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  amber: {
    chip: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  violet: {
    chip: "bg-violet-50 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  muted: {
    chip: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
} as const satisfies Record<string, SoftChipTone>;

export type SoftChipToneKey = keyof typeof SOFT_CHIP_TONES;

type SoftChipProps = {
  label: string;
  tone: SoftChipTone | SoftChipToneKey;
  /** Compact chip for secondary labels (e.g. tenant). */
  size?: "default" | "sm";
  /** Status / lifecycle chips keep the dot; category/role chips can hide it. */
  showDot?: boolean;
  className?: string;
};

/** Soft UI tinted text chip — single visual standard for Soft admin labels. */
export function SoftChip({
  label,
  tone,
  size = "default",
  showDot = true,
  className,
}: SoftChipProps) {
  const resolved = typeof tone === "string" ? SOFT_CHIP_TONES[tone] : tone;
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold",
        showDot ? "gap-1.5 rounded-full" : "rounded-md",
        size === "sm"
          ? "px-2.5 py-0.5 text-[11px] font-medium"
          : "px-2.5 py-0.5 text-xs",
        resolved.chip,
        className,
      )}
    >
      {showDot ? (
        <span
          className={cn("size-1.5 shrink-0 rounded-full", resolved.dot)}
          aria-hidden
        />
      ) : null}
      {label}
    </span>
  );
}
