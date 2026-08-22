"use client";

import { AuthSplitShell } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function AdminAuthShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("authShell");

  return (
    <AuthSplitShell
      variant="admin"
      badge={t("brand")}
      panelImage={{
        src: "/auth/admin-shell.png",
        alt: t("imageAlt"),
      }}
      topRight={
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeSwitcher />
        </div>
      }
    >
      {children}
    </AuthSplitShell>
  );
}
