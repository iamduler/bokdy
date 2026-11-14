"use client";

import { BokdyMark } from "@bokdy/brand";
import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { PlayerProfile } from "@/components/profile/player-profile";
import { useLogout } from "@/hooks/use-auth";
import { Link, useRouter } from "@/i18n/navigation";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const router = useRouter();
  const logout = useLogout();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-4 md:p-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <BokdyMark alt={tc("appName")} className="mb-2 h-6 w-auto" width={96} height={24} />
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/dashboard">{t("dashboard")}</Link></Button>
          <Button variant="outline" onClick={() => logout.mutate(undefined, { onSettled: () => { router.push("/login"); router.refresh(); } })}>{tc("logout")}</Button>
        </div>
      </header>
      <PlayerProfile />
    </main>
  );
}
