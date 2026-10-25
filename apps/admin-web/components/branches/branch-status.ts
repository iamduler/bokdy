import type { SoftStatusToneKey } from "@/components/entity/soft-status-chip";
import type { BranchStatus } from "@/lib/api/branches";

export const BRANCH_STATUS_TONE: Record<BranchStatus, SoftStatusToneKey> = {
  active: "emerald",
  inactive: "muted",
  maintenance: "amber",
  archived: "muted",
};
