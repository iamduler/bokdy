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
import { MoreHorizontal, Plus, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { DataListEmpty, softDirectoryPrimaryBtn } from "@/components/data-list";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import {
  EntityDetailError,
  EntityDetailLoading,
} from "@/components/entity/detail-state";
import { EntitySectionHead } from "@/components/entity/section-head";
import { SoftChip } from "@/components/entity/soft-chip";
import { OrganizationDetailScreenHeader } from "@/components/organizations/detail/organization-detail-screen-header";
import { useOrganizationDetail } from "@/components/organizations/detail/organization-detail-context";
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

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function memberLabel(m: StaffMember) {
  return m.display_name?.trim() || m.email?.trim() || m.user_id;
}

function primaryRole(m: StaffMember): StaffRoleCode {
  if (m.roles.some((r) => r.code === "org_owner")) return "org_owner";
  return "org_staff";
}

const AVATAR_TONES = [
  "text-violet-600 dark:text-violet-400 bg-violet-500/15",
  "text-primary bg-primary/15",
  "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15",
  "text-amber-600 dark:text-amber-400 bg-amber-500/15",
  "text-sky-600 dark:text-sky-400 bg-sky-500/15",
] as const;

const SOFT_ROW = "border-border/40 hover:bg-muted/30";

export function TeamView() {
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const ts = useTranslations("shell");
  const { org, orgId } = useOrganizationDetail();
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
    const active = staff.filter((m) => m.status === "active").length;
    const suspended = staff.filter((m) => m.status === "suspended").length;
    return {
      owners,
      staffRole,
      active,
      suspended,
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <OrganizationDetailScreenHeader
        title={t("title", { name: org.name })}
        subtitle={t("subtitle", {
          count: counts.total,
          pending: counts.pending,
        })}
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
      />

      <div className="min-h-0 flex-1 overflow-y-auto soft-scrollbar p-4 pb-6 md:px-6">
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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <EntityDetailPanel className="min-w-0 overflow-hidden">
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
                  {invitations.map((inv, i) => (
                    <TableRow key={`inv-${inv.id}`} className={SOFT_ROW}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                              AVATAR_TONES[i % AVATAR_TONES.length],
                            )}
                          >
                            {initialsFrom(inv.email)}
                          </div>
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
                  {staff.map((m, i) => {
                    const label = memberLabel(m);
                    const role = primaryRole(m);
                    const rowIndex = invitations.length + i;
                    return (
                      <TableRow key={m.id} className={SOFT_ROW}>
                        <TableCell>
                          <button
                            type="button"
                            className="flex items-center gap-2 text-left outline-none focus-visible:underline"
                            onClick={() => setEditMember(m)}
                          >
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                                AVATAR_TONES[rowIndex % AVATAR_TONES.length],
                              )}
                            >
                              {initialsFrom(label)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-bold">
                                {label}
                              </p>
                              {m.title ? (
                                <p className="truncate text-xs text-muted-foreground">
                                  {m.title}
                                </p>
                              ) : m.email && m.display_name ? (
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
            </EntityDetailPanel>

            <aside className="soft-elevated h-fit rounded-2xl border-0 p-4">
              <EntitySectionHead
                icon={<Users className="size-4" aria-hidden />}
                tone="sky"
              >
                {t("sidebar.title")}
              </EntitySectionHead>
              {(
                [
                  ["owners", counts.owners],
                  ["staff", counts.staffRole],
                  ["active", counts.active],
                  ["suspended", counts.suspended],
                  ["pending", counts.pending],
                ] as const
              ).map(([key, count]) => {
                const max = Math.max(counts.total, counts.pending, 1);
                return (
                  <div key={key} className="mb-3 last:mb-0">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {t(`sidebar.${key}`)}
                      </span>
                      <span className="font-bold text-primary">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/60">
                      <div
                        className="h-full rounded-full bg-primary/80"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </aside>
          </div>
        ) : null}
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
    </div>
  );
}
