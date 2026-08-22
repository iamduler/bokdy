"use client";

import { useTranslations } from "next-intl";

import { SessionsList } from "@/components/sessions/sessions-list";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function SessionsPage() {
  const t = useTranslations("sessions");
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.sessions"));

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("pageDescription")}</p>
      </div>
      <SessionsList />
    </main>
  );
}
