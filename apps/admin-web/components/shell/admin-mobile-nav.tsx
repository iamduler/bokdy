"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { PopoverCommandSelect, type PopoverCommandOption } from "@/components/popover-command-select";
import { AdminNavIconView } from "@/components/shell/admin-nav-icon";
import { usePathname, useRouter } from "@/i18n/navigation";
import { isNavItemActive, visibleAdminNavGroups, type AdminNavItem } from "@/lib/admin-nav";

function activeHref(pathname: string, items: AdminNavItem[]): string {
  const match = items
    .filter((item) => isNavItemActive(pathname, item.href))
    .sort((left, right) => (right.href?.length ?? 0) - (left.href?.length ?? 0))[0];
  return match?.href ?? "";
}

/** Mobile shell navigation. Desktop keeps the icon rail. */
export function AdminMobileNav() {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const router = useRouter();
  const items = useMemo(
    () => visibleAdminNavGroups().flatMap((group) => group.items),
    [],
  );
  const options = useMemo<PopoverCommandOption[]>(
    () =>
      items.flatMap((item) =>
        item.href
          ? [
              {
                value: item.href,
                label: t(`nav.${item.labelKey}`),
                keywords: t(`nav.${item.labelKey}`),
                leading: <AdminNavIconView name={item.icon} className="size-4" />,
              },
            ]
          : [],
      ),
    [items, t],
  );
  const value = activeHref(pathname, items);

  return (
    <PopoverCommandSelect
      className="h-9 min-w-0 max-w-40 flex-1 px-2.5 md:hidden"
      aria-label={t("openMenu")}
      align="start"
      value={value}
      options={options}
      placeholder={t("openMenu")}
      onValueChange={(href) => {
        if (!href || href === pathname) return;
        router.push(href);
      }}
    />
  );
}
