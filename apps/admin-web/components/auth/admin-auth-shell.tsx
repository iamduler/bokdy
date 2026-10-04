"use client";

/**
 * Hallmark · genre: modern-minimal · theme: bokdy-custom · design-system: design.md
 * style: Minimalism & Swiss (ui-ux-pro-max) · macrostructure: split-diptych
 * enrichment: soft auth atmosphere stage (Star Surge unmounted)
 */

import { cn } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { AdminAuthBanner } from "@/components/auth/admin-auth-banner";
import { AdminAuthFeaturePane } from "@/components/auth/admin-auth-feature-pane";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";

const switcherClassName =
  "border-shell-border-strong bg-shell-card text-shell-text hover:border-shell-accent hover:bg-shell-accent-soft! hover:text-shell-text! data-[state=open]:border-shell-accent data-[state=open]:bg-shell-accent-soft! data-[state=open]:text-shell-text! data-[state=open]:ring-shell-accent/25";

export function AdminAuthShell({ children }: { children: React.ReactNode }) {
  const tShell = useTranslations("authShell");
  const tAuth = useTranslations("auth");

  return (
    <main
      className={cn(
        "shell--admin",
        "relative min-h-dvh overflow-x-clip bg-shell-auth-atmosphere text-shell-text",
      )}
    >
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-5">
        <LocaleSwitcher className={switcherClassName} />
        <ThemeSwitcher className={switcherClassName} />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-2xl border border-shell-border-strong bg-shell-card shadow-sm lg:grid-cols-2">
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
            <header className="mb-8 space-y-3">
              <AdminAuthBanner alt={tShell("brand")} />
            </header>

            {children}
          </div>

          <div className="hidden border-shell-border p-3 lg:block lg:border-l">
            <AdminAuthFeaturePane />
          </div>
        </div>
      </div>
    </main>
  );
}
