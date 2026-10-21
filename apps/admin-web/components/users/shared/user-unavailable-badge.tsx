"use client";

import { useTranslations } from "next-intl";

import { EntityUnavailableBadge } from "@/components/entity/unavailable";

/** Users directory unavailable cell — shared Soft muted chip. */
export function UserUnavailableBadge() {
  const t = useTranslations("users");
  return <EntityUnavailableBadge label={t("unavailable")} />;
}
