"use client";

import { useTranslations } from "next-intl";

import { SystemHolidaysView } from "@/components/holidays/system-holidays-view";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function SystemHolidaysPage() {
  const t = useTranslations("organization.holidays");
  usePageShellTitle(t("systemTitle"));

  return <SystemHolidaysView />;
}
