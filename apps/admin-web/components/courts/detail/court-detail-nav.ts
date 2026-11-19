export const COURT_DETAIL_TABS = [
  { id: "overview", segment: "" },
  { id: "bookings", segment: "bookings" },
] as const;

export type CourtDetailTabId = (typeof COURT_DETAIL_TABS)[number]["id"];

export function courtDetailBase(courtId: string) {
  return `/courts/${courtId}`;
}

export function courtDetailHref(courtId: string, tab: CourtDetailTabId) {
  const base = courtDetailBase(courtId);
  const item = COURT_DETAIL_TABS.find((entry) => entry.id === tab);
  if (!item || item.segment === "") return base;
  return `${base}/${item.segment}`;
}

export function resolveCourtDetailTab(pathname: string, base: string): CourtDetailTabId {
  if (pathname === base) return "overview";
  const rest = pathname.startsWith(`${base}/`) ? pathname.slice(base.length + 1) : "";
  const segment = rest.split("/")[0] ?? "";
  const match = COURT_DETAIL_TABS.find((item) => item.segment === segment);
  return match?.id ?? "overview";
}
