/**
 * Admin shell navigation — mirrors Figma Make `ADMIN_NAV` plus Account items.
 *
 * `status: "missing"` stays in this list as the extension catalog and is not rendered.
 * Flip an item to `ready` and set `href` when its API exists.
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
  | "branches"
  | "courts"
  | "bookings"
  | "holidays"
  | "settings"
  | "usersPlayers"
  | "usersOwners"
  | "usersAdmins"
  | "revenue"
  | "support"
  | "risk"
  | "platform"
  | "dashboard"
  | "profile"
  | "sessions";

export type AdminNavGroupId = "platform" | "users" | "account";

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
  | "mapPin"
  | "landPlot"
  | "calendarCheck"
  | "calendar"
  | "barChart3"
  | "ticket"
  | "shield"
  | "settings"
  | "layoutDashboard"
  | "user"
  | "users"
  | "userCog"
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
      {
        id: "branches",
        labelKey: "branches",
        href: "/branches",
        status: "ready",
        icon: "mapPin",
      },
      {
        id: "courts",
        labelKey: "courts",
        href: "/courts",
        status: "ready",
        icon: "landPlot",
      },
      {
        id: "bookings",
        labelKey: "bookings",
        href: "/bookings",
        status: "ready",
        icon: "calendarCheck",
      },
      {
        id: "settings",
        labelKey: "settings",
        href: "/settings",
        status: "ready",
        icon: "settings",
      },
      { id: "revenue", labelKey: "revenue", status: "missing", icon: "barChart3" },
      { id: "support", labelKey: "support", status: "missing", icon: "ticket" },
      { id: "risk", labelKey: "risk", status: "missing", icon: "shield" },
      { id: "platform", labelKey: "platform", status: "missing", icon: "settings" },
    ],
  },
  {
    id: "users",
    labelKey: "users",
    items: [
      {
        id: "usersPlayers",
        labelKey: "usersPlayers",
        href: "/users/players",
        status: "ready",
        icon: "user",
      },
      {
        id: "usersOwners",
        labelKey: "usersOwners",
        href: "/users/owners",
        status: "ready",
        icon: "userCog",
      },
      {
        id: "usersAdmins",
        labelKey: "usersAdmins",
        href: "/users/admins",
        status: "ready",
        icon: "shield",
      },
    ],
  },
];

/** Groups shown in the sidebar: ready items only, empty groups omitted. */
export function visibleAdminNavGroups(
  groups: AdminNavGroup[] = ADMIN_NAV_GROUPS,
): AdminNavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.status === "ready" && item.href),
    }))
    .filter((group) => group.items.length > 0);
}

export const ADMIN_SIDEBAR_COLLAPSE_KEY = "bokdy.admin.sidebar.collapsed";

export function isNavItemActive(pathname: string, href: string | undefined): boolean {
  if (!href) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
