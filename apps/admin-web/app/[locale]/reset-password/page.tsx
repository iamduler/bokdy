import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { AdminAuthShell } from "@/components/auth/admin-auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "auth" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${t("resetPasswordTitle")} · ${tCommon("appName")}`,
  };
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <AdminAuthShell>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AdminAuthShell>
  );
}
