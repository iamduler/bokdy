import type { SoftChipToneKey } from "@/components/entity/soft-chip";
import type { StaffStatus } from "@/lib/api/org-staff";

/** Staff status → SoftChip tone (canonical Soft palette). */
export const STAFF_STATUS_TONE: Record<StaffStatus | "pending", SoftChipToneKey> = {
  active: "emerald",
  invited: "amber",
  pending: "amber",
  suspended: "rose",
  resigned: "muted",
};
