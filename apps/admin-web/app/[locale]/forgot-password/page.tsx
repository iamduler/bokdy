import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminAuthShell } from "@/components/auth/admin-auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

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
    title: `${t("forgotPasswordTitle")} · ${tCommon("appName")}`,
  };
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <AdminAuthShell>
      <ForgotPasswordForm />
    </AdminAuthShell>
  );
}
