"use client";

/**
 * Hallmark · theme: bokdy-custom · design-system: design.md · Soft UI icon rail
 */

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { AdminNavIconView } from "@/components/shell/admin-nav-icon";
import { Link, usePathname } from "@/i18n/navigation";
import {
  isNavItemActive,
  visibleAdminNavGroups,
  type AdminNavItem,
} from "@/lib/admin-nav";

function NavItem({ item }: { item: AdminNavItem }) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const label = t(`nav.${item.labelKey}`);
  const active = isNavItemActive(pathname, item.href);

  if (!item.href) return null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={label}
        isActive={active}
        asChild
        className="size-10 justify-center rounded-full p-0 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground [&>span]:sr-only"
      >
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          onClick={() => setOpenMobile(false)}
        >
          <AdminNavIconView name={item.icon} />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/** Soft UI content-height icon rail (no Help / theme / logout). */
export function AdminSidebar() {
  const groups = visibleAdminNavGroups();

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="soft-icon-rail border-none"
    >
      <SidebarContent className="gap-1 overflow-visible px-1 py-2">
        {groups.map((group) => (
          <SidebarGroup key={group.id} className="p-1">
            <SidebarGroupContent>
              <SidebarMenu className="items-center gap-1">
                {group.items.map((item) => (
                  <NavItem key={item.id} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
