"use client";

import { useTranslations } from "next-intl";

import { ProfileForm } from "@/components/profile/profile-form";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.profile"));

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <ProfileForm />
    </main>
  );
}
