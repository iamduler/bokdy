"use client";

import { useTranslations } from "next-intl";

import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { usePageShellTitle } from "@/components/shell/shell-title";

export default function ProfileEditPage() {
  const ts = useTranslations("shell");
  usePageShellTitle(ts("pageTitles.profileEdit"));

  return (
    <div className="page-canvas">
      <ProfileEditForm />
    </div>
  );
}
