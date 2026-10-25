export const BRANCH_DETAIL_TABS = [
  { id: "overview", segment: "" },
  { id: "pricing", segment: "pricing" },
  { id: "images", segment: "images" },
  { id: "courts", segment: "courts" },
  { id: "schedule", segment: "schedule" },
  { id: "amenities", segment: "amenities" },
] as const;

export type BranchDetailTabId = (typeof BRANCH_DETAIL_TABS)[number]["id"];

/** Canonical top-level branch detail base (not nested under organization). */
export function branchDetailBase(branchId: string) {
  return `/branches/${branchId}`;
}

/** Resolve the active tab from a locale-less pathname under the branch base. */
export function resolveBranchDetailTab(pathname: string, base: string): BranchDetailTabId {
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) : "";
  const segment = rest.split("/").filter(Boolean)[0] ?? "";
  const match = BRANCH_DETAIL_TABS.find((tab) => tab.segment === segment);
  return match?.id ?? "overview";
}

/** `edit` is a sheet-only route that redirects; no tab chrome. */
export function isBranchFormRoute(pathname: string, base: string): boolean {
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) : "";
  return rest.split("/").filter(Boolean)[0] === "edit";
}
