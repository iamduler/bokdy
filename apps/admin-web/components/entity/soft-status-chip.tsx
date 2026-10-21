import { cn } from "@bokdy/ui";

export type SoftStatusTone = {
  chip: string;
  dot: string;
};

/** Shared Soft UI tone presets — domain badges map status → one of these. */
export const SOFT_STATUS_TONES = {
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
} as const satisfies Record<string, SoftStatusTone>;

export type SoftStatusToneKey = keyof typeof SOFT_STATUS_TONES;

type SoftStatusChipProps = {
  label: string;
  tone: SoftStatusTone | SoftStatusToneKey;
  /** Compact chip for secondary status (e.g. tenant). */
  size?: "default" | "sm";
  className?: string;
};

/** Soft UI tinted status chip with colored dot — shared by org/user/entity badges. */
export function SoftStatusChip({
  label,
  tone,
  size = "default",
  className,
}: SoftStatusChipProps) {
  const resolved = typeof tone === "string" ? SOFT_STATUS_TONES[tone] : tone;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        size === "sm"
          ? "px-2.5 py-0.5 text-[11px] font-medium"
          : "px-2.5 py-0.5 text-xs",
        resolved.chip,
        className,
      )}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", resolved.dot)}
        aria-hidden
      />
      {label}
    </span>
  );
}
