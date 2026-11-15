"use client";

import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from "@bokdy/ui";
import { MoreHorizontal, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  DataListEmpty,
  softDetailSectionGap,
  softDirectoryPrimaryBtn,
} from "@/components/data-list";
import { FilterSearchField } from "@/components/data-list/filter-search-field";
import { FilterSelect } from "@/components/data-list/filter-select";
import { entityInitials } from "@/components/entity/avatar";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import {
  EntityDetailError,
  EntityDetailLoading,
} from "@/components/entity/detail-state";
import { SoftChip } from "@/components/entity/soft-chip";
import { OrganizationSectionFrame } from "@/components/organizations/detail/organization-section-frame";
import { useOrganizationDetail } from "@/components/organizations/detail/organization-detail-context";
import { type PopoverCommandOption } from "@/components/popover-command-select";
import { TeamInviteSheet } from "@/components/team/team-invite-sheet";
import { TeamMemberSheet } from "@/components/team/team-member-sheet";
import { TeamRoleChip } from "@/components/team/team-role-chip";
import { STAFF_STATUS_TONE } from "@/components/team/team-status";
import { useBranches } from "@/hooks/use-branches";
import {
  useOrgInvitations,
  useOrgStaff,
  useRestoreOrgStaff,
  useRevokeOrgInvitation,
  useSuspendOrgStaff,
} from "@/hooks/use-org-staff";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import type {
  InvitationSummary,
  StaffMember,
  StaffRoleCode,
} from "@/lib/api/org-staff";

function MemberAvatar({ name }: { name: string }) {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
      {entityInitials(name) || "?"}
    </div>
  );
}

function memberLabel(m: StaffMember) {
  return m.full_name?.trim() || m.email?.trim() || m.user_id;
}

function primaryRole(m: StaffMember): StaffRoleCode {
  if (m.roles.some((r) => r.code === "org_owner")) return "org_owner";
  return "org_staff";
}

const SOFT_ROW = "border-border/40 hover:bg-muted/30";
const ALL = "";
const TEAM_ROLES = ["org_owner", "org_staff"] as const satisfies readonly StaffRoleCode[];
const TEAM_STATUSES = ["active", "suspended", "resigned", "pending"] as const;

function textMatches(parts: Array<string | null | undefined>, needle: string) {
  if (!needle) return true;
  return parts.some((part) => part?.toLowerCase().includes(needle));
}

export function TeamView() {
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const ts = useTranslations("shell");
  const { orgId } = useOrganizationDetail();
  const staffQuery = useOrgStaff(orgId);
  const invitesQuery = useOrgInvitations(orgId);
  const { data: branches = [] } = useBranches(orgId);
  const suspend = useSuspendOrgStaff(orgId);
  const restore = useRestoreOrgStaff(orgId);
  const revoke = useRevokeOrgInvitation(orgId);

  const staff = staffQuery.data ?? [];
  const invitations = invitesQuery.data ?? [];
  const isLoading = staffQuery.isLoading || invitesQuery.isLoading;
  const isError = staffQuery.isError || invitesQuery.isError;
  const error = staffQuery.error ?? invitesQuery.error;
  const hasRows = staff.length > 0 || invitations.length > 0;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [query, setQuery] = useState("");
  const [filterRole, setFilterRole] = useState(ALL);
  const [filterStatus, setFilterStatus] = useState(ALL);
  const needle = query.trim().toLowerCase();

  const filteredInvitations = useMemo(() => {
    return invitations.filter((inv) => {
      if (filterStatus && filterStatus !== "pending") return false;
      if (filterRole && inv.role_code !== filterRole) return false;
      return textMatches([inv.email], needle);
    });
  }, [filterRole, filterStatus, invitations, needle]);

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      if (filterRole) {
        const codes = member.roles.map((role) => role.code);
        const matched = codes.length > 0 ? codes.some((code) => code === filterRole) : primaryRole(member) === filterRole;
        if (!matched) return false;
      }
      if (filterStatus) {
        const pending = member.status === "invited";
        if (filterStatus === "pending" ? !pending : member.status !== filterStatus) return false;
      }
      return textMatches([member.full_name, member.email, member.title], needle);
    });
  }, [filterRole, filterStatus, needle, staff]);

  const filtering = needle !== "" || filterRole !== ALL || filterStatus !== ALL;
  const shown = filteredInvitations.length + filteredStaff.length;

  const roleOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: ALL, label: t("allRoles"), keywords: "all" },
      ...TEAM_ROLES.map((role) => ({
        value: role,
        label: t(`roles.${role}`),
        keywords: role,
      })),
    ],
    [t],
  );
  const statusOptions = useMemo<PopoverCommandOption[]>(
    () => [
      { value: ALL, label: t("allStatuses"), keywords: "all" },
      ...TEAM_STATUSES.map((status) => ({
        value: status,
        label: t(`status.${status}`),
        keywords: status,
      })),
    ],
    [t],
  );

  const branchName = useMemo(() => {
    const map = new Map(
      branches.map((b) => [b.id, b.name_vi || b.name_en || b.code || b.id]),
    );
    return (branchId?: string) =>
      (branchId && map.get(branchId)) || t("member.noBranch");
  }, [branches, t]);

  const counts = useMemo(() => {
    const owners = staff.filter((m) =>
      m.roles.some((r) => r.code === "org_owner"),
    ).length;
    const staffRole = staff.filter(
      (m) =>
        m.roles.some((r) => r.code === "org_staff") &&
        !m.roles.some((r) => r.code === "org_owner"),
    ).length;
    return {
      owners,
      staffRole,
      pending: invitations.length,
      total: staff.length,
    };
  }, [staff, invitations.length]);

  const refetch = () => {
    void staffQuery.refetch();
    void invitesQuery.refetch();
  };

  const runStaffAction = async (
    action: "suspend" | "restore",
    member: StaffMember,
  ) => {
    try {
      if (action === "suspend") {
        await suspend.mutateAsync(member.id);
        toast.success(t("member.suspendSuccess"));
      } else {
        await restore.mutateAsync(member.id);
        toast.success(t("member.restoreSuccess"));
      }
    } catch (err) {
      const key = err instanceof ApiError ? errorMessageKey(err) : "generic";
      toast.error(te(key));
    }
  };

  const runRevoke = async (inv: InvitationSummary) => {
    try {
      await revoke.mutateAsync(inv.id);
      toast.success(t("invite.revokeSuccess"));
    } catch (err) {
      const key = err instanceof ApiError ? errorMessageKey(err) : "generic";
      toast.error(te(key));
    }
  };

  return (
    <>
      <OrganizationSectionFrame
        title={t("title")}
        subtitle={
          filtering
            ? t("subtitleFiltered", {
                shown,
                total: staff.length + invitations.length,
              })
            : t("subtitle", {
                count: counts.total,
                pending: counts.pending,
              })
        }
        toolbar={
          hasRows ? (
            <>
              <FilterSearchField value={query} onChange={setQuery} label={t("search")} />
              <FilterSelect
                value={filterRole}
                onValueChange={setFilterRole}
                options={roleOptions}
                ariaLabel={t("filterRole")}
              />
              <FilterSelect
                value={filterStatus}
                onValueChange={setFilterStatus}
                options={statusOptions}
                ariaLabel={t("filterStatus")}
              />
            </>
          ) : null
        }
        actions={
          <Button
            type="button"
            size="lg"
            className={softDirectoryPrimaryBtn}
            onClick={() => setInviteOpen(true)}
          >
            <Plus className="size-4" aria-hidden />
            {t("invite.cta")}
          </Button>
        }
      >
        {isLoading ? <EntityDetailLoading label={tc("loading")} /> : null}
        {isError ? (
          <EntityDetailError
            message={t("loadError")}
            notFound={error instanceof ApiError && error.status === 404}
            retryLabel={tc("retry")}
            onRetry={refetch}
            retryDisabled={staffQuery.isFetching || invitesQuery.isFetching}
            backHref={`/organizations/${orgId}`}
            backLabel={ts("menuBack")}
          />
        ) : null}
        {!isLoading && !isError && !hasRows ? (
          <DataListEmpty
            title={t("empty")}
            description={t("emptyHint")}
            action={
              <Button
                type="button"
                size="lg"
                className={cn("mt-3", softDirectoryPrimaryBtn)}
                onClick={() => setInviteOpen(true)}
              >
                <Plus className="size-4" aria-hidden />
                {t("invite.cta")}
              </Button>
            }
          />
        ) : null}
        {!isLoading && !isError && hasRows ? (
          <div className={cn("flex flex-col", softDetailSectionGap)}>
            <div className="soft-elevated grid grid-cols-3 border-0 px-4 py-3">
              {(
                [
                  ["owners", counts.owners],
                  ["staff", counts.staffRole],
                  ["pending", counts.pending],
                ] as const
              ).map(([key, count]) => (
                <div key={key} className="min-w-0 px-2 text-center first:pl-0 last:pr-0">
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {count}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t(`sidebar.${key}`)}
                  </p>
                </div>
              ))}
            </div>
            <EntityDetailPanel className="min-w-0 overflow-hidden">
              {shown === 0 ? (
                <DataListEmpty className="flex-none py-8" title={t("emptyFiltered")} />
              ) : (
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="border-border/40 hover:bg-transparent">
                    {[
                      t("colMember"),
                      t("colRole"),
                      t("colBranch"),
                      t("colStatus"),
                      "",
                    ].map((h) => (
                      <TableHead
                        key={h || "actions"}
                        className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvitations.map((inv) => (
                    <TableRow key={`inv-${inv.id}`} className={SOFT_ROW}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MemberAvatar name={inv.email} />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-bold">
                              {inv.email}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {t("invite.pendingHint")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TeamRoleChip
                          code={inv.role_code}
                          label={t(`roles.${inv.role_code}`)}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        —
                      </TableCell>
                      <TableCell>
                        <SoftChip
                          label={t("status.pending")}
                          tone={STAFF_STATUS_TONE.pending}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={t("actions.more")}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => void runRevoke(inv)}
                            >
                              {t("actions.revoke")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredStaff.map((m) => {
                    const label = memberLabel(m);
                    const role = primaryRole(m);
                    return (
                      <TableRow key={m.id} className={SOFT_ROW}>
                        <TableCell>
                          <button
                            type="button"
                            className="flex items-center gap-2 text-left outline-none focus-visible:underline"
                            onClick={() => setEditMember(m)}
                          >
                            <MemberAvatar name={label} />
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-bold">
                                {label}
                              </p>
                              {m.title ? (
                                <p className="truncate text-xs text-muted-foreground">
                                  {m.title}
                                </p>
                              ) : m.email && m.full_name ? (
                                <p className="truncate text-xs text-muted-foreground">
                                  {m.email}
                                </p>
                              ) : null}
                            </div>
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {m.roles.length > 0 ? (
                              m.roles.map((r) => (
                                <TeamRoleChip
                                  key={r.id}
                                  code={r.code}
                                  label={t(`roles.${r.code}`)}
                                />
                              ))
                            ) : (
                              <TeamRoleChip
                                code={role}
                                label={t(`roles.${role}`)}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {branchName(m.branch_id)}
                        </TableCell>
                        <TableCell>
                          <SoftChip
                            label={t(`status.${m.status}`)}
                            tone={STAFF_STATUS_TONE[m.status]}
                          />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t("actions.more")}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => setEditMember(m)}
                              >
                                {t("actions.edit")}
                              </DropdownMenuItem>
                              {m.status === "active" ? (
                                <DropdownMenuItem
                                  onSelect={() =>
                                    void runStaffAction("suspend", m)
                                  }
                                >
                                  {t("actions.suspend")}
                                </DropdownMenuItem>
                              ) : null}
                              {m.status === "suspended" ? (
                                <DropdownMenuItem
                                  onSelect={() =>
                                    void runStaffAction("restore", m)
                                  }
                                >
                                  {t("actions.restore")}
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              )}
            </EntityDetailPanel>
          </div>
        ) : null}
      </OrganizationSectionFrame>

      <TeamInviteSheet
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        organizationId={orgId}
      />
      <TeamMemberSheet
        open={editMember !== null}
        onOpenChange={(next) => {
          if (!next) setEditMember(null);
        }}
        organizationId={orgId}
        member={editMember}
      />
    </>
  );
}
