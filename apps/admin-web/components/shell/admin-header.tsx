"use client";

import { Separator, SidebarTrigger } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { useShellTitle } from "@/components/shell/shell-title";
import { usePathname } from "@/i18n/navigation";
import { ADMIN_NAV_GROUPS, isNavItemActive } from "@/lib/admin-nav";

function useFallbackPageTitle(): string {
  const t = useTranslations("shell");
  const pathname = usePathname();

  for (const group of ADMIN_NAV_GROUPS) {
    for (const item of group.items) {
      if (item.status === "ready" && isNavItemActive(pathname, item.href)) {
        return t(`pageTitles.${item.labelKey}`);
      }
    }
  }

  return t("pageTitles.fallback");
}

export function AdminHeader() {
  const t = useTranslations("shell");
  const { title: pageTitle, setActionSlot } = useShellTitle();
  const fallbackTitle = useFallbackPageTitle();
  const title = pageTitle ?? fallbackTitle;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1 md:hidden" aria-label={t("openMenu")} />
        <Separator orientation="vertical" className="mr-2 h-4 md:hidden" />
        <h1 className="min-w-0 truncate text-sm font-semibold tracking-tight text-foreground md:text-base">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2 px-4">
        <div ref={setActionSlot} className="flex items-center gap-2" />
      </div>
    </header>
  );
}
