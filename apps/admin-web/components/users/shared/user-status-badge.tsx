"use client";

import { useTranslations } from "next-intl";

import {
  SoftStatusChip,
  type SoftStatusToneKey,
} from "@/components/entity/soft-status-chip";
import type { UserStatus } from "@/lib/api/admin-users";

const USER_TONE: Record<UserStatus, SoftStatusToneKey> = {
  active: "emerald",
  suspended: "rose",
  pending: "amber",
  locked: "violet",
  deleted: "muted",
};

/** Domain wrapper around SoftStatusChip for user lifecycle. */
export function UserStatusBadge({ status }: { status: string }) {
  const t = useTranslations("users.status");
  const key = status in USER_TONE ? (status as UserStatus) : "deleted";
  return <SoftStatusChip label={t(key)} tone={USER_TONE[key]} />;
}
