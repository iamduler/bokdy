import {
  SoftStatusChip,
  type SoftStatusToneKey,
} from "@/components/entity/soft-status-chip";

type EntityStatusBadgeProps = {
  label: string;
  tone?: SoftStatusToneKey;
  className?: string;
};

/** Soft status chip for entity surfaces (branches, etc.). */
export function EntityStatusBadge({
  label,
  tone = "muted",
  className,
}: EntityStatusBadgeProps) {
  return <SoftStatusChip label={label} tone={tone} className={className} />;
}
