import { SoftChip, type SoftChipToneKey } from "@/components/entity/soft-chip";

type EntityStatusBadgeProps = {
  label: string;
  tone?: SoftChipToneKey;
  className?: string;
};

/** Soft status chip for entity surfaces (branches, etc.). */
export function EntityStatusBadge({
  label,
  tone = "muted",
  className,
}: EntityStatusBadgeProps) {
  return <SoftChip label={label} tone={tone} className={className} />;
}
