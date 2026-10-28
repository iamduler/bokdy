/**
 * Soft lifecycle / status chip — re-exports SoftChip with status naming.
 * Canonical tones + component: soft-chip.tsx (do not invent local chip styles).
 */
export {
  SoftChip as SoftStatusChip,
  SOFT_CHIP_TONES as SOFT_STATUS_TONES,
  type SoftChipTone as SoftStatusTone,
  type SoftChipToneKey as SoftStatusToneKey,
} from "@/components/entity/soft-chip";
