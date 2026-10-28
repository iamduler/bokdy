import type { SoftStatusToneKey } from "@/components/entity/soft-status-chip";
import type { CourtStatus } from "@/lib/api/courts";

export const COURT_STATUS_TONE: Record<CourtStatus, SoftStatusToneKey> = {
  active: "emerald",
  inactive: "muted",
  maintenance: "amber",
  archived: "muted",
};
