"use client";

import {
  SoftStatusChip,
  type SoftStatusToneKey,
} from "@/components/entity/soft-status-chip";

export function MappedStatusBadge<Status extends string>({
  status,
  tones,
  label,
  fallback,
}: {
  status: string;
  tones: Record<Status, SoftStatusToneKey>;
  label: (status: Status) => string;
  fallback?: Status;
}) {
  const key = (status in tones ? status : fallback) as Status | undefined;
  if (!key || !(key in tones)) return null;
  return <SoftStatusChip label={label(key)} tone={tones[key]} />;
}
