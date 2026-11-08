"use client";

import { useTranslations } from "next-intl";

import { InfoHint } from "@/components/info-hint";
import { SessionsList } from "@/components/sessions/sessions-list";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function SessionsPage() {
  const t = useTranslations("sessions");
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.sessions"));

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <InfoHint text={t("pageDescription")} />
        </div>
      </div>
      <SessionsList />
    </main>
  );
}
