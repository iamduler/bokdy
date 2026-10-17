"use client";

import { BokdyMark } from "@bokdy/brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@bokdy/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MouseEvent } from "react";

import { AdminNavIconView } from "@/components/shell/admin-nav-icon";
import { NotificationBell } from "@/components/shell/notification-bell";
import { UserMenu } from "@/components/shell/user-menu";
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
      <SidebarMenuButton tooltip={label} isActive={active} asChild>
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

export function AdminSidebar({
  email,
  displayName,
}: {
  email?: string;
  displayName?: string;
}) {
  const tc = useTranslations("common");
  const t = useTranslations("shell");
  const { state, toggleSidebar, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const groups = visibleAdminNavGroups();

  function onEmptyDoubleClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("a, button, input, textarea, select")) return;
    toggleSidebar();
  }

  return (
    <Sidebar
      collapsible="icon"
      onDoubleClick={isMobile ? undefined : onEmptyDoubleClick}
    >
      <button
        type="button"
        className="absolute top-1/2 -right-3 z-30 hidden size-5 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm md:inline-flex"
        aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
        onClick={toggleSidebar}
      >
        {collapsed ? (
          <ChevronRight className="size-3" />
        ) : (
          <ChevronLeft className="size-3" />
        )}
      </button>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/organizations">
                <BokdyMark
                  alt={tc("appName")}
                  className="size-7 shrink-0 object-contain"
                  width={28}
                  height={28}
                />
                <span className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">
                    {t("brandSubtitle")}
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.id}>
            <SidebarGroupLabel>
              {t(`navGroups.${group.labelKey}`)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavItem key={item.id} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NotificationBell placement="sidebar" />
        <UserMenu email={email} displayName={displayName} layout="sidebar" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
