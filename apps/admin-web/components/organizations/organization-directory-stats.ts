import type { AdminOrganization } from "@/lib/api/admin";

export type OrganizationDirectoryStats = {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  branchTotal: number;
};

export function deriveOrganizationDirectoryStats(
  orgs: AdminOrganization[] | undefined,
): OrganizationDirectoryStats {
  const list = orgs ?? [];
  return {
    total: list.length,
    active: list.filter((o) => o.status === "active").length,
    inactive: list.filter((o) => o.status === "inactive").length,
    suspended: list.filter((o) => o.status === "suspended").length,
    branchTotal: list.reduce((sum, o) => sum + (o.branch_count ?? 0), 0),
  };
}
