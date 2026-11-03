import type { AdminOrganizationDirectoryStats } from "@/lib/api/admin";

export type OrganizationDirectoryStats = {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  branchTotal: number;
};

export function organizationDirectoryStatsFromApi(
  stats: AdminOrganizationDirectoryStats | undefined,
): OrganizationDirectoryStats {
  return {
    total: stats?.total ?? 0,
    active: stats?.active ?? 0,
    inactive: stats?.inactive ?? 0,
    suspended: stats?.suspended ?? 0,
    branchTotal: stats?.branch_total ?? 0,
  };
}
