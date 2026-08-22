"use client";

import { useTranslations } from "next-intl";

import { useAdminHealth } from "@/hooks/use-admin-health";

export function AdminHealthBadge() {
  const t = useTranslations("shell");
  const { data, isLoading, isError } = useAdminHealth();

  if (isLoading) {
    return <span className="size-1.5 rounded-full bg-muted-foreground/40" aria-hidden />;
  }

  if (isError || !data) {
    return <span className="text-xs text-muted-foreground">{t("healthError")}</span>;
  }

  return (
    <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
      {t("healthOk", { status: data.status, scope: data.scope })}
    </span>
  );
}
