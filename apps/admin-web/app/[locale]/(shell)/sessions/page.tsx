"use client";

import { useTranslations } from "next-intl";

import { SessionsList } from "@/components/sessions/sessions-list";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function SessionsPage() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.sessions"));

  return (
    <div className="page-canvas">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
        <SessionsList />
      </div>
    </div>
  );
}
