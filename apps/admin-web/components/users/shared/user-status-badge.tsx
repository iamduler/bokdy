"use client";

import { cn } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import type { UserStatus } from "@/lib/api/admin-users";

const STYLES: Record<UserStatus, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  suspended: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  locked: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  deleted: "border-border bg-muted text-muted-foreground",
};

export function UserStatusBadge({ status }: { status: string }) {
  const t = useTranslations("users.status");
  const key = status in STYLES ? (status as UserStatus) : "deleted";
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold",
        STYLES[key],
      )}
    >
      {t(key)}
    </span>
  );
}
