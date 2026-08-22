"use client";

import { useTranslations } from "next-intl";

export function UserUnavailableBadge() {
  const t = useTranslations("users");
  return (
    <span className="inline-flex rounded border border-dashed border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {t("unavailable")}
    </span>
  );
}
