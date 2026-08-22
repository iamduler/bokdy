"use client";

import { cn } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import type { AdminUserDirectoryStats } from "@/lib/api/admin-users";

type UserDirectoryKpisProps = {
  stats?: AdminUserDirectoryStats;
  isLoading: boolean;
};

export function UserDirectoryKpis({ stats, isLoading }: UserDirectoryKpisProps) {
  const t = useTranslations("users.kpis");

  const items = [
    { label: t("total"), value: stats?.total, color: "text-sky-600 dark:text-sky-400" },
    { label: t("active"), value: stats?.active, color: "text-emerald-600 dark:text-emerald-400" },
    { label: t("newThisWeek"), value: stats?.new_this_week, color: "text-violet-600 dark:text-violet-400" },
    { label: t("suspended"), value: stats?.suspended, color: "text-red-600 dark:text-red-400" },
  ];

  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-border px-4 py-3 md:grid-cols-4 md:px-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-border bg-card/60 px-3 py-2.5"
        >
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {item.label}
          </p>
          <p className={cn("font-display text-xl font-extrabold", item.color)}>
            {isLoading ? "—" : (item.value ?? 0).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
