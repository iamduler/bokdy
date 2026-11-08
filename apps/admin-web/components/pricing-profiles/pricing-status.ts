import type { SoftStatusToneKey } from "@/components/entity/soft-status-chip";

export function pricingStatusKey(profile: { published: boolean; status?: string }) {
  if (profile.published && profile.status === "draft") return "activeDraft" as const;
  if (profile.published) return "activeBadge" as const;
  if (profile.status === "retired") return "retired" as const;
  return "draft" as const;
}

export const PRICING_STATUS_TONE: Record<ReturnType<typeof pricingStatusKey>, SoftStatusToneKey> = {
  activeBadge: "emerald",
  activeDraft: "amber",
  draft: "amber",
  retired: "muted",
};
