"use client";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { Menu, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { NotificationBell } from "@/components/shell/notification-bell";
import { useShellTitle } from "@/components/shell/shell-title";
import { UserMenu } from "@/components/shell/user-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";
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

export function AdminHeader({
  email,
  displayName,
  onOpenMobileNav,
}: {
  email?: string;
  displayName?: string;
  onOpenMobileNav: () => void;
}) {
  const t = useTranslations("shell");
  const { title: pageTitle } = useShellTitle();
  const fallbackTitle = useFallbackPageTitle();
  const title = pageTitle ?? fallbackTitle;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-3 md:px-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 px-0 md:hidden"
        onClick={onOpenMobileNav}
        aria-label={t("openMenu")}
      >
        <Menu className="h-4 w-4" />
      </Button>

      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight text-foreground md:text-base">
        {title}
      </h1>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="hidden sm:inline-flex">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-2 px-2.5 text-xs text-muted-foreground"
                disabled
                aria-label={t("quickSearch")}
              >
                <Search className="h-3.5 w-3.5" />
                <span>{t("quickSearch")}</span>
                <kbd className="rounded border border-border bg-muted px-1 text-[10px]">⌘K</kbd>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("quickSearchUnavailable")}</TooltipContent>
        </Tooltip>

        <LocaleSwitcher />
        <ThemeSwitcher persistToProfile />
        <NotificationBell />

        <Tooltip>
          <TooltipTrigger asChild>
            <span className="hidden lg:inline-flex">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs text-muted-foreground"
                disabled
                aria-label={t("ownerApp")}
              >
                ← {t("ownerApp")}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("ownerAppUnavailable")}</TooltipContent>
        </Tooltip>

        <UserMenu email={email} displayName={displayName} />
      </div>
    </header>
  );
}
