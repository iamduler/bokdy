"use client";

import { Button } from "@bokdy/ui";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const t = useTranslations("shell");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-4 md:p-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">{tc("appName")}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{t("welcome")}</h1>
          <p className="mt-1 text-zinc-600">{t("subtitle")}</p>
        </div>
        <Button variant="outline" onClick={logout}>
          {tc("logout")}
        </Button>
      </header>
    </main>
  );
}
