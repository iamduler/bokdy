"use client";

import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("shell");

  return (
    <main className="mx-auto w-full max-w-5xl p-4 md:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("welcome")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
    </main>
  );
}
