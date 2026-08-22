"use client";

import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { AdminNavIconView } from "@/components/shell/admin-nav-icon";
import { Link, usePathname } from "@/i18n/navigation";
import {
  ADMIN_NAV_GROUPS,
  isNavItemActive,
  type AdminNavItem,
} from "@/lib/admin-nav";

function NavItemRow({
  item,
  collapsed,
  onNavigate,
}: {
  item: AdminNavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const label = t(`nav.${item.labelKey}`);
  const unavailable = t("unavailable");
  const active =
    item.status === "ready" && isNavItemActive(pathname, item.href);
  const missing = item.status === "missing";

  const className = cn(
    "flex w-full items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-sm transition-colors",
    collapsed && "justify-center px-2",
    active && "border-primary/20 bg-primary/10 font-semibold text-primary",
    !active &&
      !missing &&
      "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
    missing && "cursor-not-allowed text-muted-foreground/70",
  );

  const body = (
    <>
      <AdminNavIconView name={item.icon} className="h-4 w-4 shrink-0" />
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {missing ? (
            <span className="shrink-0 rounded border border-dashed border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {unavailable}
            </span>
          ) : null}
        </>
      ) : null}
    </>
  );

  const tooltipLabel = missing ? `${label} · ${unavailable}` : label;

  const control =
    missing || !item.href ? (
      <button
        type="button"
        className={className}
        disabled
        aria-disabled="true"
        title={tooltipLabel}
      >
        {body}
      </button>
    ) : (
      <Link
        href={item.href}
        className={className}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
      >
        {body}
      </Link>
    );

  if (!collapsed) {
    return control;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("flex w-full", missing && "cursor-not-allowed")}>
          {control}
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">{tooltipLabel}</TooltipContent>
    </Tooltip>
  );
}

export function AdminSidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations("shell");

  return (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto soft-scrollbar px-2 py-3">
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.id} className="space-y-1">
          {!collapsed ? (
            <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t(`navGroups.${group.labelKey}`)}
            </p>
          ) : null}
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <NavItemRow
                key={item.id}
                item={item}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebarBrand({ collapsed }: { collapsed: boolean }) {
  const tc = useTranslations("common");
  const t = useTranslations("shell");

  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center gap-2 border-b border-border px-3",
        collapsed && "justify-center px-2",
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
        B
      </div>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-foreground">
            {tc("appName")}
          </p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("brandSubtitle")}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function AdminSidebarCollapseButton({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("shell");
  const label = collapsed ? t("expandSidebar") : t("collapseSidebar");

  const button = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 w-full justify-start gap-2 px-2.5 text-muted-foreground",
        collapsed && "justify-center px-2",
      )}
      onClick={onToggle}
      aria-label={label}
    >
      {collapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
      {!collapsed ? <span className="text-xs">{label}</span> : null}
    </Button>
  );

  if (!collapsed) {
    return <div className="border-t border-border p-2">{button}</div>;
  }

  return (
    <div className="border-t border-border p-2">
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export function AdminSidebarChrome({
  collapsed,
  onToggleCollapse,
  onNavigate,
  footer,
}: {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  footer?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col bg-background">
      <AdminSidebarBrand collapsed={collapsed} />
      <AdminSidebarNav collapsed={collapsed} onNavigate={onNavigate} />
      {footer}
      {onToggleCollapse ? (
        <AdminSidebarCollapseButton
          collapsed={collapsed}
          onToggle={onToggleCollapse}
        />
      ) : null}
    </div>
  );
}
