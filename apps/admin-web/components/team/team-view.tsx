"use client";

import {
  Button,
  Checkbox,
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
import { Crown, Mail, MoreHorizontal, Plus, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  DataListEmpty,
  DataListStats,
  DataTablePagination,
  DataTableSkeleton,
  softDetailSectionGap,
} from "@/components/data-list";
import { FilterSearchField } from "@/components/data-list/filter-search-field";
import { FilterSelect } from "@/components/data-list/filter-select";
import { BulkDeleteBar } from "@/components/entity/bulk-delete-bar";
import { ConfirmActionDialog } from "@/components/entity/confirm-action-dialog";
import { useBulkSelection } from "@/components/entity/use-bulk-selection";
import { entityInitials } from "@/components/entity/avatar";
import { EntityCollectionPanel } from "@/components/entity/collection-panel";
import { SoftChip } from "@/components/entity/soft-chip";
import { useClientCollectionPage } from "@/components/entity/use-client-collection-page";
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
  useRemoveOrgStaff,
  useRemoveOrgStaffMany,
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

type TeamRow =
  | { kind: "invitation"; invitation: InvitationSummary }
  | { kind: "staff"; member: StaffMember };

function textMatches(parts: Array<string | null | undefined>, needle: string) {
  if (!needle) return true;
  return parts.some((part) => part?.toLowerCase().includes(needle));
}

export function TeamView() {
  const t = useTranslations("team");
  const tOrg = useTranslations("organization");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const { orgId } = useOrganizationDetail();
  const staffQuery = useOrgStaff(orgId);
  const invitesQuery = useOrgInvitations(orgId);
  const { data: branches = [] } = useBranches(orgId);
  const suspend = useSuspendOrgStaff(orgId);
  const restore = useRestoreOrgStaff(orgId);
  const revoke = useRevokeOrgInvitation(orgId);
  const remove = useRemoveOrgStaff(orgId);
  const removeMany = useRemoveOrgStaffMany(orgId);
  const selection = useBulkSelection();

  const staff = staffQuery.data ?? [];
  const invitations = invitesQuery.data ?? [];
  const isLoading = staffQuery.isLoading || invitesQuery.isLoading;
  const isError = staffQuery.isError || invitesQuery.isError;
  const hasRows = staff.length > 0 || invitations.length > 0;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);
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

  const shown = filteredInvitations.length + filteredStaff.length;
  const filteredRows = useMemo<TeamRow[]>(
    () => [
      ...filteredInvitations.map((invitation) => ({ kind: "invitation" as const, invitation })),
      ...filteredStaff.map((member) => ({ kind: "staff" as const, member })),
    ],
    [filteredInvitations, filteredStaff],
  );
  const { pageItems, pagination } = useClientCollectionPage(
    filteredRows,
    `${needle}|${filterRole}|${filterStatus}`,
  );
  const selectablePageIds = pageItems.flatMap((row) =>
    row.kind === "staff" && row.member.status !== "resigned" ? [row.member.id] : [],
  );
  const pageAllSelected =
    selectablePageIds.length > 0 && selectablePageIds.every((id) => selection.selectedSet.has(id));

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

  function inviteButton() {
    return (
      <Button type="button" size="sm" onClick={() => setInviteOpen(true)}>
        <Plus className="size-3.5" aria-hidden />
        {t("invite.cta")}
      </Button>
    );
  }

  return (
    <>
      <div className={cn("flex flex-col p-5 pt-2 md:px-6", softDetailSectionGap)}>
        <DataListStats
          isLoading={isLoading}
          className="grid-cols-3 md:grid-cols-3"
          items={[
            {
              key: "owners",
              label: t("sidebar.owners"),
              value: counts.owners,
              icon: <Crown className="size-4" aria-hidden />,
              iconTone: "sky",
            },
            {
              key: "staff",
              label: t("sidebar.staff"),
              value: counts.staffRole,
              icon: <Users className="size-4" aria-hidden />,
              iconTone: "emerald",
            },
            {
              key: "pending",
              label: t("sidebar.pending"),
              value: counts.pending,
              icon: <Mail className="size-4" aria-hidden />,
              iconTone: "amber",
            },
          ]}
        />
        <EntityCollectionPanel
          title={t("title")}
          icon={<Users className="size-4" aria-hidden />}
          tone="sky"
          actions={inviteButton()}
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
          pagination={
            !isLoading && !isError && shown > 0 ? (
              <DataTablePagination
                {...pagination}
                className="bg-transparent px-0 md:px-0"
                leading={
                  <BulkDeleteBar
                    placement="footer"
                    count={selection.selected.length}
                    selectedLabel={tOrg("bulkSelected", { count: selection.selected.length })}
                    deleteLabel={t("actions.delete")}
                    title={t("actions.bulkDeleteTitle", { count: selection.selected.length })}
                    description={t("actions.bulkDeleteConfirm", { count: selection.selected.length })}
                    cancelLabel={t("actions.cancel")}
                    pending={removeMany.isPending}
                    onClear={selection.clear}
                    onConfirm={async () => {
                      let result;
                      try {
                        result = await removeMany.mutateAsync(selection.selected);
                      } catch (err) {
                        const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
                        toast.error(te(errorMessageKey(apiErr)));
                        throw err;
                      }
                      selection.keep(result.failed.map((item) => item.id));
                      if (result.succeeded.length > 0) {
                        toast.success(t("actions.bulkDeleted", { count: result.succeeded.length }));
                      }
                      if (result.failed.length > 0) {
                        toast.error(tOrg("bulkFailed", { count: result.failed.length }));
                      }
                    }}
                  />
                }
              />
            ) : null
          }
        >
          {isLoading ? <DataTableSkeleton rows={4} columns={5} className="px-0" /> : null}
          {isError ? (
            <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{t("loadError")}</p>
              <Button
                variant="outline"
                size="lg"
                onClick={refetch}
                disabled={staffQuery.isFetching || invitesQuery.isFetching}
              >
                {tc("retry")}
              </Button>
            </div>
          ) : null}
          {!isLoading && !isError && !hasRows ? (
            <DataListEmpty className="py-10" title={t("empty")} action={inviteButton()} />
          ) : null}
          {!isLoading && !isError && hasRows ? (
            <div className={cn("flex flex-col", softDetailSectionGap)}>
              {shown === 0 ? <DataListEmpty className="py-10" title={t("emptyFiltered")} /> : null}
              {shown > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            pageAllSelected
                              ? true
                              : selectablePageIds.some((id) => selection.selectedSet.has(id))
                                ? "indeterminate"
                                : false
                          }
                          disabled={selectablePageIds.length === 0}
                          aria-label={tOrg("selectPage")}
                          onCheckedChange={() => selection.toggleMany(selectablePageIds)}
                        />
                      </TableHead>
                      {[t("colMember"), t("colRole"), t("colBranch"), t("colStatus"), ""].map((heading) => (
                        <TableHead
                          key={heading || "actions"}
                          className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          {heading}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageItems.map((row) => {
                      if (row.kind === "invitation") {
                        const inv = row.invitation;
                        return (
                          <TableRow key={`inv-${inv.id}`} className={SOFT_ROW}>
                            <TableCell />
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MemberAvatar name={inv.email} />
                                <div className="min-w-0">
                                  <p className="truncate text-[13px] font-bold">{inv.email}</p>
                                  <p className="truncate text-xs text-muted-foreground">{t("invite.pendingHint")}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <TeamRoleChip code={inv.role_code} label={t(`roles.${inv.role_code}`)} />
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">—</TableCell>
                            <TableCell>
                              <SoftChip label={t("status.pending")} tone={STAFF_STATUS_TONE.pending} />
                            </TableCell>
                            <TableCell>
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button type="button" variant="ghost" size="icon-sm" aria-label={t("actions.more")}>
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem variant="destructive" onSelect={() => void runRevoke(inv)}>
                                    {t("actions.revoke")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      const member = row.member;
                      const label = memberLabel(member);
                      const role = primaryRole(member);
                      return (
                        <TableRow key={member.id} className={SOFT_ROW}>
                          <TableCell>
                            {member.status === "resigned" ? null : (
                              <Checkbox
                                checked={selection.selectedSet.has(member.id)}
                                aria-label={tOrg("selectRow")}
                                onCheckedChange={() => selection.toggle(member.id)}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              className="flex items-center gap-2 text-left outline-none focus-visible:underline"
                              onClick={() => setEditMember(member)}
                            >
                              <MemberAvatar name={label} />
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-bold">{label}</p>
                                {member.title ? (
                                  <p className="truncate text-xs text-muted-foreground">{member.title}</p>
                                ) : member.email && member.full_name ? (
                                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                                ) : null}
                              </div>
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {member.roles.length > 0 ? (
                                member.roles.map((item) => (
                                  <TeamRoleChip key={item.id} code={item.code} label={t(`roles.${item.code}`)} />
                                ))
                              ) : (
                                <TeamRoleChip code={role} label={t(`roles.${role}`)} />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{branchName(member.branch_id)}</TableCell>
                          <TableCell>
                            <SoftChip label={t(`status.${member.status}`)} tone={STAFF_STATUS_TONE[member.status]} />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button type="button" variant="ghost" size="icon-sm" aria-label={t("actions.more")}>
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => setEditMember(member)}>
                                  {t("actions.edit")}
                                </DropdownMenuItem>
                                {member.status === "active" ? (
                                  <DropdownMenuItem onSelect={() => void runStaffAction("suspend", member)}>
                                    {t("actions.suspend")}
                                  </DropdownMenuItem>
                                ) : null}
                                {member.status === "suspended" ? (
                                  <DropdownMenuItem onSelect={() => void runStaffAction("restore", member)}>
                                    {t("actions.restore")}
                                  </DropdownMenuItem>
                                ) : null}
                                {member.status !== "resigned" ? (
                                  <DropdownMenuItem variant="destructive" onSelect={() => setRemoveTarget(member)}>
                                    {t("actions.delete")}
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
              ) : null}
            </div>
          ) : null}
        </EntityCollectionPanel>
      </div>

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
      <ConfirmActionDialog
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title={t("member.removeConfirmTitle")}
        description={t("member.removeConfirmBody", { name: removeTarget ? memberLabel(removeTarget) : "" })}
        confirmLabel={t("actions.delete")}
        cancelLabel={t("actions.cancel")}
        pending={remove.isPending}
        destructive
        onConfirm={() => {
          if (!removeTarget) return;
          void remove.mutateAsync(removeTarget.id).then(
            () => {
              toast.success(t("member.removeSuccess"));
              setRemoveTarget(null);
            },
            (err: unknown) => {
              const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
              toast.error(te(errorMessageKey(apiErr)));
            },
          );
        }}
      />
    </>
  );
}
