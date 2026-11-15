"use client";

import { useTranslations } from "next-intl";

import { MappedStatusBadge } from "@/components/entity/mapped-status-badge";
import type { SoftStatusToneKey } from "@/components/entity/soft-status-chip";
import type { UserStatus } from "@/lib/api/admin-users";

const USER_TONE: Record<UserStatus, SoftStatusToneKey> = {
  active: "emerald",
  suspended: "rose",
  pending: "amber",
  locked: "violet",
  deleted: "muted",
};

/** Domain wrapper around MappedStatusBadge for user lifecycle. */
export function UserStatusBadge({ status }: { status: string }) {
  const t = useTranslations("users.status");
  return (
    <MappedStatusBadge
      status={status}
      tones={USER_TONE}
      fallback="deleted"
      label={(key) => t(key)}
    />
  );
}
