"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { useLogout } from "@/hooks/use-auth";
import { useRouter } from "@/i18n/navigation";

export default function DashboardPage() {
  const t = useTranslations("shell");
  const tc = useTranslations("common");
  const router = useRouter();
  const logout = useLogout();

  async function onLogout() {
    await logout.mutateAsync().catch(() => undefined);
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-4 md:p-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{tc("appName")}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{t("welcome")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button variant="outline" onClick={onLogout} disabled={logout.isPending}>
          {tc("logout")}
        </Button>
      </header>
    </main>
  );
}
