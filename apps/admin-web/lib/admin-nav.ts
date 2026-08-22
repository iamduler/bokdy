/**
 * Admin shell navigation — mirrors Figma Make `ADMIN_NAV` plus Account items.
 *
 * `status: "missing"` items stay visible and labeled “Chưa có”; do not call deferred APIs.
 *
 * Proposed APIs for missing surfaces (do not implement in this shell migrate):
 * - commandCenter → analytics / live ops (`F-ANALYTICS`)
 * - health → full platform health module (badge uses `GET /admin/health` only)
 * - revenue → GMV / analytics
 * - support → support tickets
 * - risk → trust & safety / fraud
 * - platform → platform settings admin APIs
 * - notifications (header) → `GET/POST /notifications*` (`F-ADMIN-PLUS-07`)
 * - commandPalette (header) → admin search / command API
 * - ownerApp (header) → productized cross-app handoff
 * - avatar image → `avatar` on me + `POST /media` (`F-MEDIA`)
 */

export type AdminNavStatus = "ready" | "missing";

export type AdminNavItemId =
  | "commandCenter"
  | "health"
  | "organizations"
  | "revenue"
  | "support"
  | "risk"
  | "platform"
  | "dashboard"
  | "profile"
  | "sessions";

export type AdminNavGroupId = "platform" | "account";

export type AdminNavItem = {
  id: AdminNavItemId;
  /** next-intl key under `shell.nav.*` */
  labelKey: AdminNavItemId;
  href?: `/${string}`;
  status: AdminNavStatus;
  /** lucide icon name resolved in the sidebar */
  icon: AdminNavIcon;
};

export type AdminNavGroup = {
  id: AdminNavGroupId;
  /** next-intl key under `shell.navGroups.*` */
  labelKey: AdminNavGroupId;
  items: AdminNavItem[];
};

export type AdminNavIcon =
  | "zap"
  | "heartPulse"
  | "building2"
  | "barChart3"
  | "ticket"
  | "shield"
  | "settings"
  | "layoutDashboard"
  | "user"
  | "monitorSmartphone";

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "platform",
    labelKey: "platform",
    items: [
      { id: "commandCenter", labelKey: "commandCenter", status: "missing", icon: "zap" },
      { id: "health", labelKey: "health", status: "missing", icon: "heartPulse" },
      {
        id: "organizations",
        labelKey: "organizations",
        href: "/organizations",
        status: "ready",
        icon: "building2",
      },
      { id: "revenue", labelKey: "revenue", status: "missing", icon: "barChart3" },
      { id: "support", labelKey: "support", status: "missing", icon: "ticket" },
      { id: "risk", labelKey: "risk", status: "missing", icon: "shield" },
      { id: "platform", labelKey: "platform", status: "missing", icon: "settings" },
    ],
  },
];

export const ADMIN_SIDEBAR_COLLAPSE_KEY = "bokdy.admin.sidebar.collapsed";

export function isNavItemActive(pathname: string, href: string | undefined): boolean {
  if (!href) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
